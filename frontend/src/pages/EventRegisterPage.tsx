
// ================= EVENT REGISTER PAGE =================

import { useEffect, useState } from "react";
import { Input, Button } from "rsuite";
import { useParams } from "react-router";

import { useAppDispatch, useAppSelector } from "../hooks/hooks";

import {
  checkInvestorPaymentStatus,
  createPaymentOrder,
  GetOneEventById,
  verifyPayment,
} from "../redux/EventThunks";

import {
  checkInvestor,
  registerEvent,
} from "../redux/Thunks/EventRegistorThunk";

import { resetPaymentState } from "../redux/paymentSlice";

import toast from "react-hot-toast";

import ResterHeader from "../components/register/RegisterInfo";
import IsClosed from "../components/userRegistration/IsClosed";
import UserProfile from "../components/userRegistration/UserProfile";
import { QrCodeImage } from "../components/userRegistration/QrCodeImage";
import { GuestDetails } from "../components/userRegistration/GuestDetails";
import { PaymentSuccess } from "../components/userRegistration/PaymentSuccess";

export default function EventRegisterPagePro() {

  // ================= HOOKS =================

  const { id } = useParams();

  const dispatch = useAppDispatch();

  const event = useAppSelector((s: any) => s.event.singleEvent);
  const investor = useAppSelector((s: any) => s.eventRegistor?.data?.investor || {});
  const registration = useAppSelector((s: any) => s.eventRegistor?.data?.registration || {});
  const guests = useAppSelector((s: any) => s.eventRegistor?.data?.registration?.participants || []);
  const alreadyPaid = useAppSelector((s: any) => s.payment.alreadyPaid);
  const error = useAppSelector((s: any) => s.payment.error);


  console.log(investor, 'investor--test00000000')
  console.log(event, 'event--test00000000000')
  console.log(guests, 'guests--test0000000')
  // ================= STATES =================

  const [form, setForm] = useState({ phone: "", });
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string>("");
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed" | "processing" | "created" | "cancelled">("pending");
  const [paymentVerified, setPaymentVerified] = useState(false);

  // ================= DERIVED VALUES =================

  const isPaymentSuccess = alreadyPaid === true;
  const isClosed = Boolean(event?.isClosed);

  // ================= LOAD EVENT =================

  useEffect(() => {

    if (!event?._id && id) {

      dispatch(GetOneEventById(id));

    }

  }, [dispatch, id, event?._id]);

  // ================= PAYMENT ERROR =================

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // ================= LOADING =================

  if (!event?._id) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">

        <div className="bg-white px-6 py-5 rounded-2xl shadow text-gray-500 font-medium">
          Loading Event...
        </div>

      </div>
    );

  }

  // ================= PHONE CHANGE =================

  const handlePhoneChange = async (value: string) => {

    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 10) return;
    setForm((prev) => ({
      ...prev,
      phone: cleaned,
    }));
    setPhoneError("");
    setReadyToSubmit(false);
    setPaymentStatus("pending");

    setPaymentVerified(false);

    dispatch(resetPaymentState());

    if (cleaned.length !== 10) return;

    try {

      // ================= INVESTOR CHECK =================

      const investorRes = await dispatch(
        checkInvestor({
          phone: cleaned,
          eventId: id,
        })
      ).unwrap();

      if (investorRes?.success) {

        setReadyToSubmit(true);

      } else {

        setPhoneError(
          "This number is not an investor"
        );

      }

      // ================= PAYMENT CHECK =================

      const paymentRes = await dispatch(
        checkInvestorPaymentStatus({
          eventId: event._id,
          phone: cleaned,
        })
      ).unwrap();

      if (paymentRes?.status === "success") {

        setPaymentStatus("success");

        setPaymentVerified(true);

        setReadyToSubmit(true);

      }

    } catch (err) {

      setPhoneError("Investor check failed");

    }

  };

  // ================= PAYMENT =================

  const handlePayment = async () => {

    if (!event?._id || !form.phone) return;

    try {

      setLoading(true);

      setPaymentStatus("processing");

      const res = await dispatch(
        createPaymentOrder({
          eventId: event._id,
          phone: form.phone,
        })
      ).unwrap();

      const { order, key } = res;

      if (!(window as any).Razorpay) {

        throw new Error("Razorpay SDK not loaded");

      }

      const options = {

        key,

        amount: order.amount,

        currency: order.currency,

        order_id: order.id,

        name: event.title,

        description: event.description,

        prefill: {
          contact: form.phone,
        },

        notes: {
          phone: form.phone,
        },

        handler: async (response: any) => {

          try {

            const result = await dispatch(
              verifyPayment({
                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,
              })
            ).unwrap();

            if (result?.success) {

              setPaymentStatus("success");

              setPaymentVerified(true);

              setReadyToSubmit(true);

              dispatch(
                checkInvestorPaymentStatus({
                  eventId: event._id,
                  phone: form.phone,
                })
              );

              localStorage.setItem(
                "payment_success",
                JSON.stringify({
                  phone: form.phone,
                  eventId: event._id,
                })
              );

            }

          } catch (err: any) {

            if (err?.status === 409) {

              setPaymentStatus("success");

              setPaymentVerified(true);

              setReadyToSubmit(true);

            } else {

              setPaymentStatus("failed");

            }

          } finally {

            setLoading(false);

          }

        },

        modal: {

          ondismiss: () => {

            setPaymentStatus("cancelled");

            setLoading(false);

          },

        },

        theme: {
          color: "#16a34a",
        },

      };

      const rzp = new (window as any).Razorpay(
        options
      );

      rzp.on("payment.failed", function () {

        setPaymentStatus("failed");

        setLoading(false);

      });

      rzp.open();

    } catch (err) {

      setPaymentStatus("failed");

      setLoading(false);

    }

  };

  // ================= REGISTER =================

  const handleRegister = async () => {

    const toastId = toast.loading(
      "Registering..."
    );

    try {

      const res = await dispatch(
        registerEvent({
          phone: form.phone,
          eventId: event._id,
          guests,
        })
      ).unwrap();

      toast.success(
        res?.message || "Registration successful",
        {
          id: toastId,
        }
      );

    } catch (err: any) {

      toast.error(
        err || "Registration failed",
        {
          id: toastId,
        }
      );

    }

  };

  // ================= UI =================

  return (

    <div className="min-h-screen bg-gray-100 py-10 px-3 flex justify-center">

      <div className="w-full max-w-5xl space-y-6">

        {/* ================= HEADER ================= */}

        <ResterHeader event={event} />

        {/* ================= CLOSED ================= */}

        {isClosed && <IsClosed />}

        {/* ================= BOOKING ================= */}

        {!isClosed && (

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">

            <h2 className="text-xl font-bold text-gray-800">
              Book Your Seat
            </h2>

            <div className="max-w-xl">

              <label className="text-sm font-medium text-gray-600 mb-2 block">
                Mobile Number
              </label>

              <Input
                placeholder="Enter your mobile number"
                value={form.phone}
                onChange={handlePhoneChange}
                className="h-12"
              />

            </div>

            {phoneError ? (

              <div className="text-sm text-red-500 font-medium">
                {phoneError}
              </div>

            ) : readyToSubmit && (

              <div className="text-sm text-green-600 font-semibold">
                You're an Investor
              </div>

            )}

            {readyToSubmit && (

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {investor && (
                  <UserProfile />
                )}

                {registration?.qrCodeImage && (
                  <QrCodeImage />
                )}

              </div>

            )}

          </div>

        )}

        {/* ================= GUEST SECTION ================= */}

        {event?.allowGuests && !isClosed && (
          <GuestDetails />
        )}

        {/* ================= PAYMENT ================= */}

        {event?.isPaid &&
          !isPaymentSuccess &&
          !isClosed && (

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-200 space-y-4">

              <h2 className="text-lg font-bold">
                Payment Required
              </h2>

              <div className="flex justify-between items-center">

                <span>Event Fee</span>

                <span className="font-bold text-red-500">
                  ₹ {event.price}
                </span>

              </div>

              <Button
                appearance="primary"
                color="red"
                block
                loading={loading}
                disabled={!readyToSubmit}
                onClick={handlePayment}
              >
                Pay & Continue
              </Button>

            </div>

          )}

        {/* ================= PAYMENT SUCCESS ================= */}

        {isPaymentSuccess && (
          <PaymentSuccess />
        )}

        {/* ================= FINAL SUBMIT ================= */}

        {!isClosed && (

          <div className="bg-gradient-to-r from-neutral-700 to-neutral-900 p-6 rounded-3xl text-white shadow-lg">

            <h2 className="text-lg font-bold">
              Confirm Booking
            </h2>

            <p className="text-sm text-gray-300 mt-1 mb-4">
              Please verify all details before submitting
            </p>

            <Button
              block
              loading={loading}
              onClick={handleRegister}
              disabled={
                !readyToSubmit ||
                loading ||
                isClosed ||
                (event?.isPaid &&
                  !isPaymentSuccess)
              }
            >
              Register & Enter Meeting Portal
            </Button>

          </div>

        )}

      </div>

    </div>

  );

}

