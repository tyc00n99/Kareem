/** A big, friendly 4-digit keypad, like the one in the Lovable prototype. */
export function PinPad({ pin, setPin, mark = '●' }: { pin: string; setPin: (p: string) => void; mark?: string }) {
  const press = (d: string) => pin.length < 4 && setPin(pin + d);
  return (
    <div className="pinpad">
      <div className="pinpad-dots" aria-label={`${pin.length} of 4 numbers entered`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`pinpad-dot${pin[i] ? ' pinpad-dot-on' : ''}`}>
            {pin[i] ? mark : ''}
          </span>
        ))}
      </div>
      <div className="pinpad-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" className="pinpad-key" onClick={() => press(d)}>
            {d}
          </button>
        ))}
        <button type="button" className="pinpad-key pinpad-key-ghost" onClick={() => setPin('')} aria-label="Clear">
          ✕
        </button>
        <button type="button" className="pinpad-key" onClick={() => press('0')}>
          0
        </button>
        <button type="button" className="pinpad-key pinpad-key-ghost" onClick={() => setPin(pin.slice(0, -1))} aria-label="Delete one">
          ⌫
        </button>
      </div>
    </div>
  );
}
