import * as process from "node:process";

export const jwtConstants = {
  secret: "nWfT9v2HcR7yUeJkLm1QpXs8AzDb3CgVt0oNhPiSaMzKlWqE",
};

export const MAX_CONTENT_DIFF = 50;

export const REFRESH_TOKEN_TIME = process.env.REFRESH_TOKEN_TIME
  ? parseInt(process.env.REFRESH_TOKEN_TIME, 10)
  : 60 * 60 * 24 * 7;

export const RATE_LIMIT_OPTIONS = {
  windowMs: 5 * 60 * 1000, // 5분 동안
  limit: 500, // 최대 300회 요청
  message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
};

export const UPLOAD_FIELDS_COUNT = [
  { name: "main_image", maxCount: 1 },
  { name: "detail_images", maxCount: 10 },
];

// 최근 해양데이터 오프셋
export const RECENT_MARINE_DATA_WINDOW = 90 * 60 * 1000; // 1시간반

// 단기예보 base_date용 – 하루 전 오프셋 (24시간)
export const SHORT_TERM_FORECAST_YESTERDAY_OFFSET = 24 * 60 * 60 * 1000;
