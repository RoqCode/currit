type DatabaseErrorWithCode = {
  code?: string;
  cause?: DatabaseErrorWithCode;
};

export default function isUniqueViolationError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const databaseError = error as DatabaseErrorWithCode;

  return (
    databaseError.code === "23505" || databaseError.cause?.code === "23505"
  );
}
