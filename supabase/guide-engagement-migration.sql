-- ============================================================================
-- 파일 경로: supabase/guide-engagement-migration.sql
-- 한밭중고전자(hanbat-mall) 정보 게시판 조회수 및 "도움됐어요" 통계 테이블·RPC
-- ============================================================================

BEGIN;

-- 1. 정보 가이드별 조회수 및 도움됐어요 집계 테이블
CREATE TABLE IF NOT EXISTS public.guide_stats (
  slug text PRIMARY KEY
    CHECK (char_length(slug) BETWEEN 1 AND 120 AND slug ~ '^[a-z0-9-]+$'),
  views integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  helpful_count integer NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 인기 TOP 3 정렬 조회를 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_guide_stats_engagement
  ON public.guide_stats (views DESC, helpful_count DESC);

-- 2. 최소 권한 및 Row Level Security (RLS)
ALTER TABLE public.guide_stats ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.guide_stats FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.guide_stats TO anon, authenticated;
GRANT ALL ON TABLE public.guide_stats TO service_role;

DROP POLICY IF EXISTS "guide_stats_select_public" ON public.guide_stats;
CREATE POLICY "guide_stats_select_public"
  ON public.guide_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. 조회수 / 도움됐어요 원자적 증감 RPC (service_role 전용)
CREATE OR REPLACE FUNCTION public.increment_guide_metric(
  p_slug text,
  p_metric text DEFAULT 'view',
  p_delta integer DEFAULT 1
)
RETURNS TABLE(guide_slug text, view_count integer, helpful_total integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_view_delta integer := 0;
  v_helpful_delta integer := 0;
  v_now timestamptz := now();
BEGIN
  IF p_slug IS NULL OR char_length(p_slug) < 1 OR char_length(p_slug) > 120 OR p_slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Invalid guide slug: %', p_slug;
  END IF;

  IF p_metric = 'view' THEN
    v_view_delta := 1;
  ELSIF p_metric = 'helpful' AND p_delta IN (1, -1) THEN
    v_helpful_delta := p_delta;
  ELSE
    RAISE EXCEPTION 'Invalid guide metric or delta: metric=%, delta=%', p_metric, p_delta;
  END IF;

  RETURN QUERY
  INSERT INTO public.guide_stats (slug, views, helpful_count, updated_at)
  VALUES (
    p_slug,
    GREATEST(0, v_view_delta),
    GREATEST(0, v_helpful_delta),
    v_now
  )
  ON CONFLICT ON CONSTRAINT guide_stats_pkey DO UPDATE
    SET views = GREATEST(0, public.guide_stats.views + v_view_delta),
        helpful_count = GREATEST(0, public.guide_stats.helpful_count + v_helpful_delta),
        updated_at = v_now
  RETURNING
    public.guide_stats.slug AS guide_slug,
    public.guide_stats.views AS view_count,
    public.guide_stats.helpful_count AS helpful_total;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_guide_metric(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_guide_metric(text, text, integer) TO service_role;

COMMIT;
