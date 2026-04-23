"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook for detecting the Hyperscaled Chrome extension and communicating
 * payment requests via window.postMessage / CustomEvent bridge.
 */
export function useExtensionBridge() {
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [extensionVersion, setExtensionVersion] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentSenderAddress, setPaymentSenderAddress] = useState(null);
  // null | "initiating" | "navigating" | "wallet_detected" | "awaiting_confirmation" | "sent" | "registered" | "error"
  const [paymentError, setPaymentError] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);
  const statusListenerRef = useRef(null);

  // Detect extension on mount — uses multiple strategies to handle timing
  useEffect(() => {
    let found = false;

    function markDetected(version) {
      if (found) return;
      found = true;
      setExtensionDetected(true);
      setExtensionVersion(version || "unknown");
    }

    // Strategy 1: Check if marker element already exists
    const marker = document.getElementById("hyperscaled-ext");
    if (marker) {
      markDetected(marker.dataset.version);
    }

    // Strategy 2: Listen for PONG response to our ping
    function handlePong(e) {
      markDetected(e.detail?.version);
    }
    document.addEventListener("HYPERSCALED_PONG", handlePong);

    // Strategy 3: MutationObserver watches for the marker element being added
    // (handles case where content script loads after React)
    const observer = new MutationObserver(() => {
      const el = document.getElementById("hyperscaled-ext");
      if (el) {
        markDetected(el.dataset.version);
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Send pings at staggered intervals to catch late-loading content scripts
    window.postMessage({ type: "HYPERSCALED_PING" }, window.location.origin);
    const retry1 = setTimeout(() => {
      if (!found) window.postMessage({ type: "HYPERSCALED_PING" }, window.location.origin);
    }, 1000);
    const retry2 = setTimeout(() => {
      if (!found) window.postMessage({ type: "HYPERSCALED_PING" }, window.location.origin);
    }, 3000);

    return () => {
      document.removeEventListener("HYPERSCALED_PONG", handlePong);
      observer.disconnect();
      clearTimeout(retry1);
      clearTimeout(retry2);
    };
  }, []);

  // Listen for payment status updates from extension
  useEffect(() => {
    function handlePaymentStatus(e) {
      const { status, error, senderAddress } = e.detail || {};
      if (status) {
        setPaymentStatus(status);
        if (senderAddress) {
          setPaymentSenderAddress(senderAddress);
        }
        if (status === "error") {
          setPaymentError(error || "An unknown error occurred");
        }
        if (status === "registered" || status === "registration_error") {
          setRegistrationResult(e.detail);
        }
      }
    }
    document.addEventListener("HYPERSCALED_PAYMENT_STATUS", handlePaymentStatus);
    statusListenerRef.current = handlePaymentStatus;

    return () => {
      document.removeEventListener(
        "HYPERSCALED_PAYMENT_STATUS",
        statusListenerRef.current
      );
    };
  }, []);

  const initiatePayment = useCallback((data) => {
    setPaymentStatus("initiating");
    setPaymentSenderAddress(null);
    setPaymentError(null);
    window.postMessage(
      {
        type: "HYPERSCALED_INIT_PAYMENT",
        data,
      },
      window.location.origin
    );
  }, []);

  const resetPaymentStatus = useCallback(() => {
    setPaymentStatus(null);
    setPaymentSenderAddress(null);
    setPaymentError(null);
    setRegistrationResult(null);
  }, []);

  return {
    extensionDetected,
    extensionVersion,
    paymentStatus,
    paymentSenderAddress,
    paymentError,
    registrationResult,
    initiatePayment,
    resetPaymentStatus,
  };
}
