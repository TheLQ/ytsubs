export async function apiVerify(res: Response) {
  const body = await res.text()
  if (body != "1") {
    const msg = "API FAILED: Message " + body
    alert(msg)
    throw new Error(msg)
  }
}