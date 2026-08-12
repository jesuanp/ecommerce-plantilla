import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Check, User, ArrowLeft, Copy } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatPrice, calculateShipping, calculateTax, copyToClipboard } from '../lib/utils';
import { ordersApi, publicSettingsApi, type Order, type BankTransferDetails } from '../lib/api';
import { useToast } from '../components/admin/Toast';
import PaymentGatewaySelector from '../components/PaymentGatewaySelector';
import PaymentProofUploader from '../components/PaymentProofUploader';
import type { PaymentContext, PaymentInitResult, PaymentGateway } from '../payments/types';
import type { CartItem } from '../types';

type Step = 'shipping' | 'auth' | 'payment' | 'proof';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart, subtotal } = useCartStore();
  const { user, checkAuth, login, register, updateProfile } = useAuthStore();
  const toast = useToast();
  const [step, setStep] = useState<Step>('shipping');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGuest, setIsGuest] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'US',
  });

  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [bankDetails, setBankDetails] = useState<BankTransferDetails | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Pagomóvil fields are numeric codes (bank code, phone, cédula) — only the
  // digits should ever land in the clipboard, no labels, spaces or dashes.
  const onlyDigits = (v: string) => v.replace(/\D/g, '');

  const copyField = (field: string, value: string) => {
    copyToClipboard(onlyDigits(value)).then(success => {
      if (success) {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1500);
      } else {
        toast.error('No se pudo copiar. Mantén presionado el texto para copiarlo manualmente.');
      }
    });
  };

  useEffect(() => {
    publicSettingsApi.get()
      .then(res => setBankDetails(res.data.bankTransferDetails))
      .catch(() => setBankDetails(null));
  }, []);

  const sub = subtotal();
  const shipping = calculateShipping(sub);
  const tax = calculateTax(sub);
  const total = sub + shipping + tax;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name || f.name,
        email: user.email || f.email,
        address: user.address || f.address,
        city: user.city || f.city,
        zipCode: user.zipCode || f.zipCode,
        country: user.country || f.country,
      }));
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Nothing to checkout</h1>
        <p className="mt-2 text-ink-500">Your cart is empty.</p>
        <Link to="/shop" className="btn-primary mt-6">Continue shopping</Link>
      </div>
    );
  }

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (authMode === 'register') {
        await register(authForm.email, authForm.password, authForm.name);
      } else {
        await login(authForm.email, authForm.password);
      }
      setStep('payment');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const submitShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.address || !form.city || !form.zipCode) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError('Please enter a valid email.');
      return;
    }

    if (user && !isGuest) {
      const changes: { name?: string; address?: string; city?: string; zipCode?: string; country?: string } = {};
      if (form.name !== (user.name ?? '')) changes.name = form.name;
      if (form.address !== (user.address ?? '')) changes.address = form.address;
      if (form.city !== (user.city ?? '')) changes.city = form.city;
      if (form.zipCode !== (user.zipCode ?? '')) changes.zipCode = form.zipCode;
      if (form.country !== (user.country ?? '')) changes.country = form.country;

      if (Object.keys(changes).length > 0) {
        setLoading(true);
        try {
          await updateProfile(changes);
          toast.success('Address saved to your profile');
        } catch (err: any) {
          setError(err.message || 'Could not save address to profile');
          setLoading(false);
          return;
        }
        setLoading(false);
      }
    }

    if (!user) {
      setStep('auth');
    } else {
      setStep('payment');
    }
  };

  const handlePayResult = async (
    result: PaymentInitResult,
    _gateway: PaymentGateway,
  ) => {
    setLoading(true);
    setError('');
    try {
      const payloadItems = items.map((i: CartItem) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        productId: i.productId,
      }));

      if (result.mode === 'demo' || result.mode === 'manual') {
        const createdOrder = await ordersApi.create({
          items: payloadItems,
          subtotal: sub,
          shipping,
          tax,
          total,
          customer: form,
          paymentMethod: result.paymentMethodKey,
        });

        // Bank transfer needs one more step: the customer uploads their
        // proof of payment before we clear the cart / navigate away.
        if (result.paymentMethodKey === 'bank_transfer') {
          setPendingOrder(createdOrder.data);
          setStep('proof');
          setLoading(false);
          return;
        }

        sessionStorage.removeItem('raybert-checkout-pending');
        localStorage.removeItem('raybert-checkout-data');
        clearCart();

        if (user) {
          navigate('/orders', { state: { highlightOrderId: createdOrder.data.id } });
        } else {
          toast.success('Order placed! Check your email for confirmation.');
          navigate('/');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong';
      setError(msg);
      setLoading(false);
    }
  };

  const paymentContext: PaymentContext = {
    amount: total,
    currency: 'USD',
    items: items.map((i: CartItem) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
      productId: i.productId,
    })),
    customer: form,
    userId: user?.id || null,
    isGuest,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Checkout</h1>

      <div className="flex items-center gap-2 mb-10 text-sm">
        <div className={`flex items-center gap-2 ${step !== 'auth' ? 'text-ink-900' : 'text-ink-400'}`}>
          <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold ${
            step !== 'shipping' ? 'bg-ink-900 text-white' : 'bg-ink-900 text-white'
          }`}>
            {step === 'auth' ? <Check className="w-3 h-3" /> : '1'}
          </span>
          Shipping
        </div>
        <div className="flex-1 h-px bg-ink-200" />
        <div className={`flex items-center gap-2 ${step === 'auth' ? 'text-ink-900' : 'text-ink-400'}`}>
          <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold ${
            step === 'auth' ? 'bg-ink-900 text-white' : step === 'payment' ? 'bg-ink-900 text-white' : 'bg-ink-200 text-ink-500'
          }`}>
            {step === 'payment' ? <Check className="w-3 h-3" /> : '2'}
          </span>
          {user ? 'Payment' : 'Account'}
        </div>
        {user && (
          <>
            <div className="flex-1 h-px bg-ink-200" />
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-ink-900' : 'text-ink-400'}`}>
              <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold ${
                step === 'payment' ? 'bg-ink-900 text-white' : 'bg-ink-200 text-ink-500'
              }`}>
                3
              </span>
              Payment
            </div>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div>
          {step === 'shipping' && (
            <form onSubmit={submitShipping} className="bg-white border border-ink-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold mb-2">Shipping details</h2>

              <div>
                <label className="text-sm font-medium block mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  required
                  className="input-base"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Full name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  required
                  className="input-base"
                  placeholder="Ada Lovelace"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Address *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={update('address')}
                  required
                  className="input-base"
                  placeholder="123 Main St, Apt 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={update('city')}
                    required
                    className="input-base"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">ZIP *</label>
                  <input
                    type="text"
                    value={form.zipCode}
                    onChange={update('zipCode')}
                    required
                    className="input-base"
                    placeholder="10001"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Country</label>
                <select value={form.country} onChange={update('country')} className="input-base">
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="MX">Mexico</option>
                  <option value="ES">Spain</option>
                </select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button type="submit" className="btn-primary w-full">
                {user ? 'Continue to payment' : 'Continue'}
              </button>
            </form>
          )}

          {step === 'auth' && (
            <div className="bg-white border border-ink-200 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ink-100 grid place-items-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">
                      {authMode === 'login' ? 'Sign in to continue' : 'Create an account'}
                    </h2>
                    <p className="text-sm text-ink-500">
                      {authMode === 'login'
                        ? 'Sign in to speed up your checkout'
                        : 'Register to save your information for next time'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setStep('shipping')} className="text-sm text-ink-500 hover:text-ink-900">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Full name</label>
                    <input
                      type="text"
                      value={authForm.name}
                      onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))}
                      required
                      className="input-base"
                      placeholder="Ada Lovelace"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="input-base"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Password</label>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
                    required
                    className="input-base"
                    placeholder="••••••••"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-ink-500">
                  {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  <button
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setError('');
                    }}
                    className="ml-1 font-medium text-ink-900 hover:underline"
                  >
                    {authMode === 'login' ? 'Register' : 'Sign in'}
                  </button>
                </p>
              </div>

              <div className="pt-4 border-t border-ink-200">
                <button
                  onClick={() => {
                    setIsGuest(true);
                    setStep('payment');
                  }}
                  className="btn-secondary w-full"
                >
                  Continue as guest (no account required)
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-4">
              <div className="bg-white border border-ink-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 pb-4 border-b border-ink-200">
                  <div className="w-10 h-10 rounded-full bg-ink-100 grid place-items-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Payment</h2>
                    <p className="text-sm text-ink-500">Choose your payment method</p>
                  </div>
                </div>

                <div className="bg-ink-100 rounded-xl p-4 mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-500">Shipping to</span>
                    <span className="font-medium text-right">
                      {form.name}<br />
                      <span className="text-ink-500 font-normal">
                        {form.address}, {form.city} {form.zipCode}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <PaymentGatewaySelector
                context={paymentContext}
                onResult={handlePayResult}
                onBack={() => setStep(user ? 'shipping' : 'auth')}
              />

              {error && <p className="text-sm text-red-600 px-1">{error}</p>}
            </div>
          )}

          {step === 'proof' && pendingOrder && (
            <div className="bg-white border border-ink-200 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-ink-200">
                <div className="w-10 h-10 rounded-full bg-ink-100 grid place-items-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Pagomovil</h2>
                  <p className="text-sm text-ink-500">
                    Orden #{pendingOrder.id.slice(0, 8)} creada — {formatPrice(total)} a transferir
                  </p>
                </div>
              </div>

              {bankDetails ? (
                <div className="bg-ink-100 rounded-xl p-4 space-y-2 text-sm">
                  {bankDetails.bankName && bankDetails.accountNumber && bankDetails.documentId && (
                    <CopyRow
                      label="Todo"
                      value={`${onlyDigits(bankDetails.bankName)} ${onlyDigits(bankDetails.accountNumber)} ${onlyDigits(bankDetails.documentId)}`}
                      field="all"
                      copiedField={copiedField}
                      onCopy={(field, value) => {
                        copyToClipboard(value).then(success => {
                          if (success) {
                            setCopiedField(field);
                            setTimeout(() => setCopiedField(null), 1500);
                          } else {
                            toast.error('No se pudo copiar. Mantén presionado el texto para copiarlo manualmente.');
                          }
                        });
                      }}
                      bold
                    />
                  )}
                  {bankDetails.bankName && (
                    <CopyRow label="Banco" value={bankDetails.bankName} field="bankName" copiedField={copiedField} onCopy={copyField} />
                  )}
                  {bankDetails.accountHolder && (
                    <CopyRow label="Titular" value={bankDetails.accountHolder} field="accountHolder" copiedField={copiedField} onCopy={copyField} />
                  )}
                  {bankDetails.accountNumber && (
                    <CopyRow label="Teléfono" value={bankDetails.accountNumber} field="accountNumber" copiedField={copiedField} onCopy={copyField} />
                  )}
                  {bankDetails.documentId && (
                    <CopyRow label="C.I." value={bankDetails.documentId} field="documentId" copiedField={copiedField} onCopy={copyField} />
                  )}
                  {bankDetails.instructions && (
                    <p className="text-ink-500 pt-1">{bankDetails.instructions}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink-500">
                  Contáctanos para obtener los datos de Pagomóvil.
                </p>
              )}

              <p className="text-sm text-ink-500">
                Una vez hecho el pago, sube una foto o PDF de tu comprobante abajo.
                Tu orden queda <span className="font-medium">pendiente</span> hasta que verifiquemos el pago.
              </p>

              <PaymentProofUploader
                orderId={pendingOrder.id}
                onUploaded={() => {
                  sessionStorage.removeItem('raybert-checkout-pending');
                  localStorage.removeItem('raybert-checkout-data');
                  clearCart();
                  toast.success('Proof uploaded! We will verify your payment shortly.');
                  if (user) {
                    navigate('/orders', { state: { highlightOrderId: pendingOrder.id } });
                  } else {
                    navigate('/');
                  }
                }}
              />
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-ink-100 rounded-2xl p-6">
            <h2 className="font-bold mb-4">Order summary</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {items.map((item: CartItem) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-ink-900 text-white text-[10px] font-bold rounded-full grid place-items-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-medium line-clamp-2 leading-snug">{item.name}</p>
                    <p className="text-ink-500 mt-0.5">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-ink-200 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Subtotal</span>
                <span>{formatPrice(sub)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-ink-200 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  field,
  copiedField,
  onCopy,
  bold,
}: {
  label: string;
  value: string;
  field: string;
  copiedField: string | null;
  onCopy: (field: string, value: string) => void;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        bold ? 'pb-2 mb-1 border-b border-ink-200' : ''
      }`}
    >
      <div>
        <span className="text-ink-500">{label}:</span>{' '}
        <span className={bold ? 'font-mono font-bold text-base tracking-wide' : 'font-medium'}>{value}</span>
      </div>
      <button
        type="button"
        onClick={() => onCopy(field, value)}
        className="shrink-0 p-1.5 rounded-lg hover:bg-white text-ink-500 hover:text-ink-900 transition-colors"
        aria-label={`Copiar ${label}`}
        title={`Copiar ${label}`}
      >
        {copiedField === field ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}