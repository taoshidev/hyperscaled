"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

async function checkStatus(addr, setState, setData) {
  setState("loading");
  setData(null);
  try {
    const res = await fetch(`/api/status?hl_address=${addr}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
      setState("registered");
    } else if (res.status === 404) {
      setState("not_found");
    } else {
      setState("error");
    }
  } catch {
    setState("error");
  }
}

export function StatusChecker() {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState("idle"); // idle | loading | registered | not_found | error
  const [data, setData] = useState(null);
  const prevAddress = useRef(null);

  useEffect(() => {
    if (isConnected && address) {
      if (prevAddress.current !== address) {
        prevAddress.current = address;
        checkStatus(address, setState, setData);
      }
    } else {
      prevAddress.current = null;
      setState("idle"); // eslint-disable-line react-hooks/set-state-in-effect -- reset on disconnect
      setData(null);
    }
  }, [isConnected, address]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4">
      <div className="space-y-6 max-w-md w-full mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Registration Status</h1>
          <p className="text-muted-foreground text-sm">
            Connect your wallet to check your registration status.
          </p>
        </div>

        <div className="flex justify-center">
          <ConnectButton />
        </div>

        {state === "loading" && (
          <div className="text-center space-y-3">
            <Loader2 className="w-12 h-12 mx-auto text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Checking status...</p>
          </div>
        )}

        {state === "registered" && (
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <h2 className="text-xl font-bold">Registered</h2>
            </div>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">HL Address</span>
                  <span className="font-mono text-xs">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                {data?.subaccount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subaccount</span>
                    <span className="font-mono text-xs">
                      {data.subaccount.slice(0, 6)}...{data.subaccount.slice(-4)}
                    </span>
                  </div>
                )}
                {data?.endpoint_url && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Endpoint</span>
                    <span className="font-mono text-xs truncate ml-4">
                      {data.endpoint_url}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-green-500">Registered</span>
                </div>
              </CardContent>
            </Card>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => checkStatus(address, setState, setData)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}

        {state === "not_found" && (
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <Clock className="w-16 h-16 mx-auto text-yellow-500" />
              <h2 className="text-xl font-bold">Not Found</h2>
            </div>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">HL Address</span>
                  <span className="font-mono text-xs">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-yellow-500">Not Found</span>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => checkStatus(address, setState, setData)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Link href="/">
                <Button className="w-full mt-2">Register Now</Button>
              </Link>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
              <h2 className="text-xl font-bold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                Could not check registration status. Please try again.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => checkStatus(address, setState, setData)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
