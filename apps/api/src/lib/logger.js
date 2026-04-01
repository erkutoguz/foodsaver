const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

function normalizeLevel(level) {
  return levels[level] !== undefined ? level : "info";
}

const currentLevel = normalizeLevel(process.env.LOG_LEVEL || "info");

function shouldLog(level) {
  return levels[level] <= levels[currentLevel];
}

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();

  if (meta === undefined) {
    return [`[${timestamp}] ${level.toUpperCase()} ${message}`];
  }

  return [`[${timestamp}] ${level.toUpperCase()} ${message}`, meta];
}

function log(level, message, meta) {
  if (!shouldLog(level)) {
    return;
  }

  const args = formatMessage(level, message, meta);
  const method = level === "error" ? "error" : "log";
  console[method](...args);
}

export const logger = {
  error(message, meta) {
    log("error", message, meta);
  },
  warn(message, meta) {
    log("warn", message, meta);
  },
  info(message, meta) {
    log("info", message, meta);
  },
  debug(message, meta) {
    log("debug", message, meta);
  }
};
