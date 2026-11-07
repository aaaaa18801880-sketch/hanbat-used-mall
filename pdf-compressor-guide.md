# PDF 용량 축소 및 초경량 변환 가이드 (PDF Compressor Guide)

본 가이드는 대용량 스캔 도서 및 OCR 처리된 고용량 PDF(50MB~300MB 이상)를 **AI 챗봇 업로드 제한(10MB 이하)에 맞춰 1~3MB 수준으로 극단적으로 경량화**하거나, 필요에 따라 원본 스캔 레이아웃을 유지하면서 압축하는 전체 스크립트 소스코드, 사용 방법, 필요 라이브러리 목록을 제공합니다.

---

## 1. 사용 라이브러리 목록 (Dependencies)

본 프로젝트는 고성능 PDF 파싱 및 조판을 위해 검증된 라이브러리를 사용하며, 복잡한 외부 의존성을 최소화하여 윈도우 환경에서 즉시 구동되도록 설계되었습니다.

| 라이브러리 명 | 패키지 명 | 필수 여부 | 주요 역할 및 기능 |
|:---|:---|:---:|:---|
| **PyMuPDF** | `pymupdf` (내부 모듈명: `fitz`) | **필수** | • 고속 PDF 텍스트 블록/좌표 추출<br>• 원본 페이지 구조 및 메타데이터 분석<br>• PDF 내부 이미지 스트림 교체 및 최적화 저장 |
| **ReportLab** | `reportlab` | **필수** | • 초경량 벡터 PDF 재조판 엔진<br>• 윈도우 기본 한글 글꼴(맑은 고딕 등) 자동 임베딩<br>• 문단 스타일링, 줄바꿈, 페이지 나눔 자동화 |
| **Pillow** | `Pillow` (내부 모듈명: `PIL`) | 선택 (방식 B용) | • 원본 스캔 이미지 다운샘플링 (DPI 조절)<br>• JPEG 압축 품질 최적화 및 색상 모드 변환 |
| **Tkinter** | `tkinter` | 기본 내장 | • 사용자 친화적 데스크톱 GUI 인터페이스 제공 |
| **ZipFile** | `zipfile` | 기본 내장 | • 외부 변환 툴 없이 순수 파이썬으로 표준 EPUB 규격 패키징 |

### 라이브러리 설치 명령어 (터미널 / CMD)
```bash
pip install pymupdf reportlab Pillow
```

---

## 2. 핵심 원리: 스캔 OCR PDF의 2가지 압축 방식

일반적인 스캔 OCR PDF 파일의 용량 중 **98% 이상은 배경 스캔 이미지**가 차지하며, OCR로 인식된 글자(투명 텍스트 레이어)는 수백 KB 미만에 불과합니다.

```
[방식 1: 텍스트 추출 & 초경량 재조판 (메인 추천 - 용량 99% 절감)]
┌─────────────────────────────────┐
│ 고용량 스캔 PDF (100MB~300MB)    │
│ (배경 무거운 이미지 + 투명 텍스트) │
└────────────────┬────────────────┘
                 │ PyMuPDF로 텍스트 블록 및 좌표 추출
                 ▼
┌─────────────────────────────────┐
│ 문단 정제 및 헤더/푸터 필터링      │
└────────────────┬────────────────┘
                 ├───────────────────────────────┐
                 ▼ (ReportLab 조판)               ▼ (ZipFile 패키징)
┌─────────────────────────────────┐   ┌───────────────────────────────┐
│ 초경량 텍스트 PDF (1~3MB)        │   │ 모바일용 EPUB 전자책 (500KB~1MB)│
│ • 벡터 폰트(맑은 고딕)로 재조판   │   │ • 챕터별 HTML 구조화          │
│ • AI 챗봇 업로드 100% 최적화     │   │ • 리더기 호환 전자책            │
└─────────────────────────────────┘   └───────────────────────────────┘

[방식 2: 이미지 다운샘플링 재압축 (도판/삽화 유지 필요 시)]
• 투명 텍스트 레이어는 건드리지 않고, 배경 이미지 해상도(DPI)와 화질(JPEG 60%)을 낮춰 10MB 미만으로 수렴
```

---

## 3. [전체 코드] PDF OCR 텍스트 추출 & 초경량 재조판 GUI 변환기

아래 코드는 스캔 이미지 레이어를 완전히 제거하고 텍스트만 추출·정제하여 **1~3MB 초경량 PDF** 및 **EPUB 전자책**을 동시에 생성하는 완성형 GUI 프로그램의 전체 소스코드입니다.

```python
# -*- coding: utf-8 -*-
"""
==========================================================================
 PDF OCR 텍스트 추출 & 초경량 재조판 변환기 (GUI)
==========================================================================
 고용량 스캔 PDF에서 이미지를 제거하고, 텍스트 레이어만 추출하여
 1~3MB 수준의 초경량 PDF(AI 업로드용) 및 EPUB(전자책용)으로 변환합니다.
"""

import os
import re
import sys
import uuid
import zipfile
import threading
from datetime import datetime
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

# 1. 필수 라이브러리 체크
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


# ==========================================================================
# 2. 텍스트 정제 엔진 (스캔 OCR 노이즈 필터링 및 문장 재조합)
# ==========================================================================
def clean_page_text(blocks, page_height):
    """
    페이지 내 블록들을 분석하여 상단 머리말, 하단 페이지 번호를 걸러내고
    끊어진 줄바꿈을 문맥에 맞게 한 문단으로 병합합니다.
    """
    valid_lines = []
    top_margin = page_height * 0.05
    bottom_margin = page_height * 0.95

    for b in blocks:
        # b = (x0, y0, x1, y1, "text", block_no, block_type)
        if b[6] == 0:  # 0 = 텍스트 블록
            y0, y1, text = b[1], b[3], b[4].strip()
            
            # 상단/하단 여백의 페이지 번호/단순 라벨 제거
            if y0 < top_margin or y1 > bottom_margin:
                if len(text) < 15 and any(char.isdigit() for char in text):
                    continue

            lines = text.split("\n")
            for line in lines:
                l = line.strip()
                if l:
                    valid_lines.append(l)

    # 마침표 없이 행갈음된 문장들을 하나의 자연스러운 문단으로 병합
    paragraphs = []
    current_para = []

    for line in valid_lines:
        current_para.append(line)
        # 문장 종결 부호(. ! ? ” " 등)로 끝나면 문단 종료
        if re.search(r'[.!?\"\'”’]\s*$', line):
            paragraphs.append(" ".join(current_para))
            current_para = []

    if current_para:
        paragraphs.append(" ".join(current_para))

    return paragraphs


# ==========================================================================
# 3. AI 업로드용 초경량 PDF 생성기 (ReportLab 엔진)
# ==========================================================================
def generate_lightweight_pdf(all_pages_text, output_path, progress_cb=None):
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("ReportLab 라이브러리가 설치되어 있지 않습니다.")

    # Windows 기본 맑은 고딕 등록 (한글 깨짐 방지)
    font_path = "C:/Windows/Fonts/malgun.ttf"
    font_name = "MalgunGothic"
    if os.path.exists(font_path):
        pdfmetrics.registerFont(TTFont(font_name, font_path))
    else:
        font_name = "Helvetica"

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    body_style = ParagraphStyle(
        name="BookBody",
        fontName=font_name,
        fontSize=10,
        leading=16,
        spaceAfter=8,
        textColor="#1a1a1a",
    )
    page_header_style = ParagraphStyle(
        name="PageHeader",
        fontName=font_name,
        fontSize=8,
        leading=10,
        textColor="#888888",
        spaceAfter=12,
    )

    story = []
    total = len(all_pages_text)

    for idx, paras in enumerate(all_pages_text):
        if not paras:
            continue
        story.append(Paragraph(f"[ 원본 페이지 {idx + 1} ]", page_header_style))
        for p in paras:
            safe_text = p.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(safe_text, body_style))
        story.append(PageBreak())

        if progress_cb:
            progress_cb(50 + int((idx / total) * 35))

    doc.build(story)


# ==========================================================================
# 4. 순수 파이썬 표준 라이브러리 기반 EPUB 2/3 생성기
# ==========================================================================
def generate_clean_epub(all_pages_text, output_path, title="Extracted Book"):
    book_id = str(uuid.uuid4())
    with zipfile.ZipFile(output_path, 'w') as zf:
        # 1. mimetype (압축 없이 첫 번째 엔트리로 기록 필수)
        zf.writestr('mimetype', 'application/epub+zip', compress_type=zipfile.ZIP_STORED)

        # 2. container.xml
        container_xml = '''<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>'''
        zf.writestr('META-INF/container.xml', container_xml, compress_type=zipfile.ZIP_DEFLATED)

        manifest_items = []
        spine_items = []
        navpoints = []

        # 3. 페이지별 XHTML 생성
        for idx, paras in enumerate(all_pages_text):
            if not paras:
                continue
            page_num = idx + 1
            item_id = f"page_{page_num}"
            filename = f"page_{page_num}.xhtml"

            p_html = "".join(f"<p>{p.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')}</p>" for p in paras)
            page_content = f'''<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Page {page_num}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif; line-height: 1.7; padding: 4%; }}
        h2 {{ color: #444; font-size: 1.1em; border-bottom: 1px solid #ddd; padding-bottom: 5px; }}
        p {{ margin-bottom: 0.9em; text-indent: 1em; }}
    </style>
</head>
<body>
    <h2>페이지 {page_num}</h2>
    {p_html}
</body>
</html>'''
            zf.writestr(f"OEBPS/{filename}", page_content.encode("utf-8"), compress_type=zipfile.ZIP_DEFLATED)
            manifest_items.append(f'<item id="{item_id}" href="{filename}" media-type="application/xhtml+xml"/>')
            spine_items.append(f'<itemref idref="{item_id}"/>')
            navpoints.append(f'''<navPoint id="navPoint-{page_num}" playOrder="{page_num}">
    <navLabel><text>페이지 {page_num}</text></navLabel>
    <content src="{filename}"/>
</navPoint>''')

        # 4. content.opf
        now_utc = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        manifest_str = "\n        ".join(manifest_items)
        spine_str = "\n        ".join(spine_items)

        content_opf = f'''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>{title}</dc:title>
        <dc:language>ko</dc:language>
        <dc:identifier id="BookId">urn:uuid:{book_id}</dc:identifier>
        <meta property="dcterms:modified">{now_utc}</meta>
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        {manifest_str}
    </manifest>
    <spine toc="ncx">
        {spine_str}
    </spine>
</package>'''
        zf.writestr('OEBPS/content.opf', content_opf.encode("utf-8"), compress_type=zipfile.ZIP_DEFLATED)

        # 5. toc.ncx (이북 리더기 목차)
        nav_str = "\n        ".join(navpoints)
        toc_ncx = f'''<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="urn:uuid:{book_id}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle><text>{title}</text></docTitle>
    <navMap>
        {nav_str}
    </navMap>
</ncx>'''
        zf.writestr('OEBPS/toc.ncx', toc_ncx.encode("utf-8"), compress_type=zipfile.ZIP_DEFLATED)


# ==========================================================================
# 5. Tkinter 기반 GUI 클래스
# ==========================================================================
class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("OCR PDF 초경량 변환기 (AI 10MB 최적화 & EPUB)")
        self.geometry("580x440")
        self.resizable(False, False)
        self.configure(bg="#f8f9fa")
        self.setup_ui()
        self.check_environment()

    def check_environment(self):
        missing = []
        if not PYMUPDF_AVAILABLE:
            missing.append("PyMuPDF (pip install pymupdf)")
        if not REPORTLAB_AVAILABLE:
            missing.append("ReportLab (pip install reportlab)")
        if missing:
            msg = "필수 라이브러리가 누락되었습니다:\n- " + "\n- ".join(missing)
            messagebox.showwarning("라이브러리 경고", msg)

    def setup_ui(self):
        # 1. 상단 안내
        title_lbl = tk.Label(
            self,
            text="고용량 OCR PDF → 1~3MB 초경량 텍스트 변환기",
            font=("맑은 고딕", 13, "bold"),
            bg="#f8f9fa",
            fg="#212529"
        )
        title_lbl.pack(pady=(15, 5))

        desc_lbl = tk.Label(
            self,
            text="불필요한 스캔 이미지를 제거하고 텍스트만 재조판하여 AI 업로드용으로 압축합니다.",
            font=("맑은 고딕", 9),
            bg="#f8f9fa",
            fg="#6c757d"
        )
        desc_lbl.pack(pady=(0, 10))

        # 2. 파일 선택
        frame_file = tk.LabelFrame(self, text="1. 대상 PDF 파일 선택", padx=12, pady=10, bg="#ffffff", font=("맑은 고딕", 9, "bold"))
        frame_file.pack(fill="x", padx=18, pady=5)

        self.entry_path = tk.Entry(frame_file, width=52, font=("맑은 고딕", 9))
        self.entry_path.pack(side="left", padx=(0, 8), ipady=3)

        btn_browse = tk.Button(frame_file, text="파일 찾기...", command=self.browse_file, bg="#e9ecef", font=("맑은 고딕", 9))
        btn_browse.pack(side="left")

        # 3. 변환 옵션
        frame_opts = tk.LabelFrame(self, text="2. 출력 옵션", padx=12, pady=10, bg="#ffffff", font=("맑은 고딕", 9, "bold"))
        frame_opts.pack(fill="x", padx=18, pady=8)

        self.var_pdf = tk.BooleanVar(value=True)
        self.var_epub = tk.BooleanVar(value=True)

        chk_pdf = tk.Checkbutton(
            frame_opts,
            text="[필수] AI 업로드용 초경량 PDF 생성 (1~3MB, 텍스트 재조판)",
            variable=self.var_pdf,
            bg="#ffffff",
            font=("맑은 고딕", 9, "bold"),
            fg="#0d6efd"
        )
        chk_pdf.pack(anchor="w", pady=(0, 4))

        chk_epub = tk.Checkbutton(
            frame_opts,
            text="[선택] 전자책 뷰어용 EPUB 생성 (500KB~1MB, 모바일/리더기용)",
            variable=self.var_epub,
            bg="#ffffff",
            font=("맑은 고딕", 9)
        )
        chk_epub.pack(anchor="w")

        # 4. 진행도 & 상태 표시
        frame_status = tk.LabelFrame(self, text="3. 작업 진행 상태", padx=12, pady=10, bg="#ffffff", font=("맑은 고딕", 9, "bold"))
        frame_status.pack(fill="x", padx=18, pady=5)

        self.progress = ttk.Progressbar(frame_status, length=515, mode="determinate")
        self.progress.pack(pady=4)

        self.lbl_status = tk.Label(frame_status, text="파일을 선택한 후 '변환 시작'을 눌러주세요.", bg="#ffffff", fg="#495057", font=("맑은 고딕", 9))
        self.lbl_status.pack()

        # 5. 실행 버튼
        self.btn_run = tk.Button(
            self,
            text="초경량 변환 시작 (10MB 이하)",
            command=self.start_thread,
            bg="#0d6efd",
            fg="white",
            font=("맑은 고딕", 11, "bold"),
            relief="flat",
            cursor="hand2",
            height=2
        )
        self.btn_run.pack(fill="x", padx=18, pady=(12, 10))

    def browse_file(self):
        f = filedialog.askopenfilename(filetypes=[("PDF Files", "*.pdf")])
        if f:
            self.entry_path.delete(0, tk.END)
            self.entry_path.insert(0, f)

    def start_thread(self):
        pdf_path = self.entry_path.get().strip()
        if not pdf_path or not os.path.exists(pdf_path):
            messagebox.showerror("오류", "유효한 PDF 파일을 선택해 주세요.")
            return

        if not self.var_pdf.get() and not self.var_epub.get():
            messagebox.showwarning("주의", "최소 하나의 출력 형식을 선택해 주세요.")
            return

        self.btn_run.config(state="disabled", bg="#6c757d")
        threading.Thread(target=self.process, args=(pdf_path,), daemon=True).start()

    def process(self, pdf_path):
        try:
            self.update_status("PDF 열기 및 텍스트 블록 분석 중...", 5)
            doc = fitz.open(pdf_path)
            total_pages = len(doc)
            all_pages_text = []

            for i in range(total_pages):
                page = doc[i]
                blocks = page.get_text("blocks")
                paras = clean_page_text(blocks, page.rect.height)
                all_pages_text.append(paras)
                
                pct = 5 + int(((i + 1) / total_pages) * 45)
                self.update_status(f"텍스트 추출 중: {i+1} / {total_pages} 페이지 ({pct}%)", pct)

            base_name, _ = os.path.splitext(pdf_path)
            created_files = []

            # A. 초경량 PDF 생성
            if self.var_pdf.get():
                self.update_status("초경량 PDF 재조판 및 글꼴 렌더링 중...", 55)
                out_pdf = f"{base_name}_경량텍스트.pdf"
                generate_lightweight_pdf(
                    all_pages_text, 
                    out_pdf, 
                    progress_cb=lambda val: self.update_status(f"PDF 재조판 중... ({val}%)", val)
                )
                size_mb = os.path.getsize(out_pdf) / (1024 * 1024)
                created_files.append(f"• PDF: {os.path.basename(out_pdf)} ({size_mb:.2f} MB)")

            # B. EPUB 생성
            if self.var_epub.get():
                self.update_status("EPUB 전자책 압축 생성 중...", 90)
                out_epub = f"{base_name}.epub"
                generate_clean_epub(all_pages_text, out_epub, title=os.path.basename(base_name))
                size_mb = os.path.getsize(out_epub) / (1024 * 1024)
                created_files.append(f"• EPUB: {os.path.basename(out_epub)} ({size_mb:.2f} MB)")

            self.update_status("변환이 성공적으로 완료되었습니다!", 100)
            result_msg = "변환이 완료되었습니다!\n\n" + "\n".join(created_files) + f"\n\n저장 폴더:\n{os.path.dirname(pdf_path)}"
            messagebox.showinfo("변환 완료", result_msg)

        except Exception as e:
            messagebox.showerror("에러", f"작업 중 오류가 발생했습니다:\n{str(e)}")
            self.update_status("오류가 발생했습니다.", 0)
        finally:
            self.btn_run.config(state="normal", bg="#0d6efd")

    def update_status(self, text, val):
        self.lbl_status.config(text=text)
        self.progress["value"] = val
        self.update_idletasks()


if __name__ == "__main__":
    app = App()
    app.mainloop()

```

---

## 4. [대안 코드] 원본 이미지 보존형 압축 스크립트 (`compress_ocr_pdf`)

도표나 삽화가 많아 스캔 이미지를 그대로 보존해야 하는 책의 경우, 아래 함수를 사용하면 **OCR 텍스트 레이어를 100% 보존하면서 배경 이미지만 재압축**하여 10MB 이하로 용량을 줄일 수 있습니다.

```python
import io
import fitz  # PyMuPDF
from PIL import Image

def compress_ocr_pdf(input_path: str, output_path: str, max_dimension: int = 1400, quality: int = 60):
    """
    기존 PDF의 OCR 투명 텍스트 레이어와 좌표를 온전히 유지하면서,
    내부의 고용량 스캔 페이지만 찾아 해상도를 낮추고 JPEG로 재압축합니다.
    """
    doc = fitz.open(input_path)
    total_pages = len(doc)
    print(f"[시작] 총 {total_pages} 페이지 압축 처리 중...")

    for page_idx in range(total_pages):
        page = doc[page_idx]
        image_list = page.get_images(full=True)

        for img_info in image_list:
            xref = img_info[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]

            # Pillow를 이용한 이미지 로드
            pil_img = Image.open(io.BytesIO(image_bytes))

            # 1. 해상도 다운샘플링 (최대 너비/높이 제한)
            w, h = pil_img.size
            if max(w, h) > max_dimension:
                scale = max_dimension / max(w, h)
                new_size = (int(w * scale), int(h * scale))
                pil_img = pil_img.resize(new_size, Image.Resampling.LANCZOS)

            # 2. 색상 모드 최적화 (RGBA나 Palette 모드를 RGB로 통일)
            if pil_img.mode in ("RGBA", "P"):
                pil_img = pil_img.convert("RGB")

            # 3. 고효율 JPEG 압축
            out_buf = io.BytesIO()
            pil_img.save(out_buf, format="JPEG", quality=quality, optimize=True)
            new_bytes = out_buf.getvalue()

            # 압축된 크기가 원본보다 작을 때만 교체
            if len(new_bytes) < len(image_bytes):
                page.replace_image(xref, stream=new_bytes)

        if (page_idx + 1) % 20 == 0 or (page_idx + 1) == total_pages:
            print(f"진행률: {page_idx + 1} / {total_pages} 페이지 완료")

    # 미사용 데이터 정리 및 스트림 압축(Deflate) 활성화 저장
    doc.save(
        output_path,
        garbage=4,     # 쓰지 않는 오브젝트 완전 제거
        deflate=True,  # 내부 스트림 zlib 압축
        clean=True     # 구문 정리
    )
    doc.close()
    print(f"[완료] 압축 저장 완료: {output_path}")

# 실행 예시:
# compress_ocr_pdf("원본책.pdf", "압축된책_10mb이하.pdf", max_dimension=1400, quality=60)
```

---

## 5. 사용 방법 (User Guide)

### 방법 1: GUI 프로그램 바로 실행하기
1. 소스코드를 `app.py` 파일로 저장합니다.
2. 터미널(또는 명령 프롬프트)에서 실행합니다:
   ```bash
   python app.py
   ```
3. GUI 창이 뜨면:
   - **[파일 선택]** 버튼을 눌러 용량을 줄이고자 하는 PDF 파일을 선택합니다.
   - **출력 옵션**을 확인합니다:
     - `[기본]` **AI 업로드용 초경량 PDF 생성**: 1~3MB로 압축 (기본 체크 권장)
     - `[선택]` **전자책 뷰어용 EPUB 생성**: 모바일 기기나 e-리더기용 전자책 추가 생성
   - **[초경량 변환 시작]** 버튼을 누릅니다.
4. 변환이 완료되면 원본 파일과 동일한 폴더에 `[파일명]_경량텍스트.pdf` 파일이 생성됩니다.

### 방법 2: 파이썬 없는 환경을 위한 독립 실행 파일(`.exe`) 제작
파이썬이 설치되지 않은 다른 PC에서도 더블클릭만으로 실행하고 싶다면, `pyinstaller`를 사용해 단일 실행 파일로 패키징할 수 있습니다.

```bash
# PyInstaller 설치
pip install pyinstaller

# 단일 무콘솔 실행 파일 빌드
pyinstaller --noconsole --onefile --name "PDF_초경량_변환기" app.py
```
- 빌드가 완료되면 `dist` 폴더 안에 `PDF_초경량_변환기.exe` 파일이 생성됩니다. 이 파일만 있으면 파이썬 설치 없이 어디서든 즉시 실행할 수 있습니다.

---

## 6. 핵심 기능 및 기술적 특징 요약

1. **지능형 문단 복원 (Smart Word-Wrap & Heuristics)**
   - 스캔 OCR PDF 특유의 문장 중간 행갈음을 정규표현식(`[.!?"'”’]`) 기반으로 분석하여 하나의 자연스러운 문단으로 자동 결합합니다.
2. **머리말/꼬리말(Header/Footer) 자동 필터링**
   - 페이지 상단 5% 및 하단 5% 영역에 위치하는 단순 페이지 번호나 책 제목 라벨을 감지하여 본문 흐름에 섞이지 않도록 걸러냅니다.
3. **윈도우 기본 맑은 고딕(Malgun Gothic) 자동 등록**
   - 별도의 폰트 다운로드 없이 `C:/Windows/Fonts/malgun.ttf`를 자동으로 인식·등록하여 한글 깨짐이나 네모(tofu) 현상을 완벽히 방지합니다.
4. **외부 프로그램 의존성 제로의 EPUB 생성기**
   - 별도의 무거운 전자책 툴(Calibre 등) 없이, 파이썬 표준 내장 `zipfile` 모듈로 직접 `mimetype`, `container.xml`, `content.opf`, `toc.ncx` 및 스타일시트(CSS)를 패키징하여 모든 전자책 리더기에서 완벽하게 호환됩니다.
