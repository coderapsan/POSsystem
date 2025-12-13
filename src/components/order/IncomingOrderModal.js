import React, { useEffect, useRef } from "react";

export default function IncomingOrderModal({
  isOpen,
  orders,
  actionButtonClass,
  subtleButtonClass,
  onAccept,
  onDismiss,
}) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (isOpen && orders && orders.length > 0) {
      // Create audio element for ringing
      if (!audioRef.current) {
        audioRef.current = new Audio();
        // Using a simple tone - you can replace with your own sound file
        // This creates a Data URI for a simple beep tone
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3; // Volume (0-1)
        
        // Create a simple ring pattern
        const playRing = () => {
          if (audioRef.current && audioRef.current.isPlaying) {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.value = 800;
            osc.type = 'sine';
            gain.gain.value = 0.3;
            
            osc.start(ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.stop(ctx.currentTime + 0.3);
            
            setTimeout(() => {
              if (audioRef.current && audioRef.current.isPlaying) {
                const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
                const osc2 = ctx2.createOscillator();
                const gain2 = ctx2.createGain();
                
                osc2.connect(gain2);
                gain2.connect(ctx2.destination);
                
                osc2.frequency.value = 1000;
                osc2.type = 'sine';
                gain2.gain.value = 0.3;
                
                osc2.start(ctx2.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, ctx2.currentTime + 0.3);
                osc2.stop(ctx2.currentTime + 0.3);
              }
            }, 400);
          }
        };
        
        audioRef.current.isPlaying = true;
        audioRef.current.intervalId = setInterval(playRing, 2000);
        playRing(); // Start immediately
      }
    } else {
      // Stop ringing when modal closes
      if (audioRef.current) {
        audioRef.current.isPlaying = false;
        if (audioRef.current.intervalId) {
          clearInterval(audioRef.current.intervalId);
        }
        audioRef.current = null;
      }
    }

    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.isPlaying = false;
        if (audioRef.current.intervalId) {
          clearInterval(audioRef.current.intervalId);
        }
        audioRef.current = null;
      }
    };
  }, [isOpen, orders]);

  const handleAccept = (orderId) => {
    // Stop ringing
    if (audioRef.current) {
      audioRef.current.isPlaying = false;
      if (audioRef.current.intervalId) {
        clearInterval(audioRef.current.intervalId);
      }
      audioRef.current = null;
    }
    onAccept(orderId);
  };

  const handleDismiss = () => {
    // Stop ringing
    if (audioRef.current) {
      audioRef.current.isPlaying = false;
      if (audioRef.current.intervalId) {
        clearInterval(audioRef.current.intervalId);
      }
      audioRef.current = null;
    }
    onDismiss();
  };

  if (!isOpen || !orders || orders.length === 0) return null;

  const currentOrder = orders[0];
  const items = currentOrder.items || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-300/40">
        <h3 className="text-xl font-semibold text-slate-900">New Online Order</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>Customer: {currentOrder.customer?.name || "Walk-in"}</p>
          <p>Order ID: {currentOrder.orderId}</p>
          <ul className="mt-2 space-y-1 rounded-xl border border-slate-200 bg-[#f9fafb] px-4 py-3 text-xs text-slate-700">
            {items.map((item, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{item.name}</span>
                <span>× {item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className={actionButtonClass} onClick={() => handleAccept(currentOrder.orderId)}>
            Accept & Print
          </button>
          <button className={subtleButtonClass} onClick={handleDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
