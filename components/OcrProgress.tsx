export function OcrProgress({ message }: { message: string }) {
  return <section className="card status"><div className="spinner" /><h1>読み取り中...</h1><p>{message}</p></section>;
}
