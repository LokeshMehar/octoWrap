"use client";

import PhonePreview from "@/components/PhonePreview";
import { formatPrice } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { getPaymentStatus } from "./actions";
import { toast } from "@/hooks/use-toast";

const ThankYou = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const { data, isError, error } = useQuery({
    queryKey: ["get-payment-status"],
    queryFn: async () => await getPaymentStatus({ orderId }),
    retry: 3,
    retryDelay: 500,
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error]);

  if (data === undefined) {
    return (
      <div className="w-full mt-24 flex justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-200">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h3 className="font-semibold text-xl">Loading your order...</h3>
          <p>This won&apos;t take long.</p>
        </div>
      </div>
    );
  }

  if (data === false) {
    return (
      <div className="w-full mt-24 flex justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-200">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h3 className="font-semibold text-xl">Verifying your payment...</h3>
          <p>This might take a moment.</p>
        </div>
      </div>
    );
  }

  const { configuration, billingAddress, shippingAddress, amount } = data;
  const { color } = configuration;

  return (
    <div className="bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-xl">
          <p className="text-base font-medium text-primary">Thank you!</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Your case is on the way!
          </h1>
          <p className="mt-2 text-base text-gray-400">
            We&apos;ve received your order and are now processing it.
          </p>

          <div className="mt-12 text-sm font-medium">
            <p className="text-gray-300">Order number</p>
            <p className="mt-2 text-gray-400">{orderId}</p>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800">
          <div className="mt-10 flex flex-auto flex-col">
            <h4 className="font-semibold text-gray-200">
              You made a great choice!
            </h4>
            <p className="mt-2 text-sm text-gray-400">
              We at CaseCobra believe that a phone case doesn&apos;t only need
              to look good, but also last you for the years to come. We offer a
              5-year print guarantee: If you case isn&apos;t of the highest
              quality, we&apos;ll replace it for free.
            </p>
          </div>
        </div>

        <div className="flex space-x-6 overflow-hidden mt-4 rounded-xl bg-gray-800/20 ring-1 ring-inset ring-gray-700 lg:rounded-2xl">
          <PhonePreview
            croppedImageUrl={configuration.croppedImageUrl!}
            color={color!}
          />
        </div>

        <div>
          <div className="grid grid-cols-2 gap-x-6 py-10 text-sm">
            <div>
              <p className="font-medium text-gray-200">Shipping address</p>
              <div className="mt-2 text-gray-400">
                <address className="not-italic">
                  <span className="block">{shippingAddress?.name}</span>
                  <span className="block">{shippingAddress?.street}</span>
                  <span className="block">
                    {shippingAddress?.postalCode} {shippingAddress?.city}
                  </span>
                </address>
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-200">Billing address</p>
              <div className="mt-2 text-gray-400">
                <address className="not-italic">
                  <span className="block">{billingAddress?.name}</span>
                  <span className="block">{billingAddress?.street}</span>
                  <span className="block">
                    {billingAddress?.postalCode} {billingAddress?.city}
                  </span>
                </address>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 border-t border-gray-800 py-10 text-sm">
            <div>
              <p className="font-medium text-gray-200">Payment status</p>
              <p className="mt-2 text-gray-400">Paid</p>
            </div>

            <div>
              <p className="font-medium text-gray-200">Shipping Method</p>
              <p className="mt-2 text-gray-400">
                DHL, takes up to 3 working days
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 border-t border-gray-800 pt-10 text-sm">
          <div className="flex justify-between">
            <p className="font-medium text-gray-200">Subtotal</p>
            <p className="text-gray-400">{formatPrice(amount)}</p>
          </div>
          <div className="flex justify-between">
            <p className="font-medium text-gray-200">Shipping</p>
            <p className="text-gray-400">{formatPrice(0)}</p>
          </div>
          <div className="flex justify-between">
            <p className="font-medium text-gray-200">Total</p>
            <p className="text-gray-400">{formatPrice(amount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;