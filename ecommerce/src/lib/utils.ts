export const formatPrice = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const calculateShipping = (subtotal: number): number => {
  return subtotal > 100 ? 0 : 9.99;
};

export const calculateTax = (subtotal: number, rate = 0.08): number => {
  return subtotal * rate;
};

/**
 * navigator.clipboard.writeText only exists in secure contexts (HTTPS, or
 * http://localhost). Testing from a phone over plain HTTP on the local
 * network (e.g. http://192.168.1.28:5173) does NOT count as secure, so the
 * modern Clipboard API is simply undefined there — calling it throws and,
 * without a fallback, taps on mobile silently do nothing.
 *
 * This falls back to the older execCommand('copy') approach, which works
 * over plain HTTP too, by writing the text into a temporarily-selected
 * offscreen textarea.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy approach below
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.select();
    textarea.setSelectionRange(0, text.length); // iOS Safari needs this explicitly

    const success = document.execCommand('copy');

    document.body.removeChild(textarea);
    if (originalRange && selection) {
      selection.removeAllRanges();
      selection.addRange(originalRange);
    }

    return success;
  } catch {
    return false;
  }
}
