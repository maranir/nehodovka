export async function share(text: string) {
  const url = location.origin + import.meta.env.BASE_URL;
  try {
    if (navigator.share) {
      await navigator.share({ text, url });
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    alert('Zkopírováno do schránky / Copied to clipboard');
  } catch {
    /* user cancelled */
  }
}
