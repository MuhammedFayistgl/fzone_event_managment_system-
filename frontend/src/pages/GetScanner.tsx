

import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    motion,
    AnimatePresence,
} from "framer-motion";

import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Loader2,
    RotateCcw,
    ScanLine,
} from "lucide-react";
import './scannerStyle.css'

import { Html5Qrcode } from "html5-qrcode";

import clsx from "clsx";

import toast from "react-hot-toast";

import {
    useAppDispatch,
    useAppSelector,
} from "../hooks/hooks";

import {
    verifyQrCode,
} from "../redux/Thunks/qrScannerThunk";
import { resetScannerState } from "../redux/Slice/qrScannerSlice";



const GateScannerUltra = () => {

    // ======================================================
    // HOOKS
    // ======================================================

    const dispatch = useAppDispatch();

    const scannerRef = useRef<any>(null);

    const scanningLock = useRef(false);

    const timeoutRef = useRef<any>(null);

    // ======================================================
    // STORE
    // ======================================================

    const {
        currentScan,
        loading,
        error,
        success,
    } = useAppSelector(
        (s: any) => s.scanner
    );

    // ======================================================
    // STATES
    // ======================================================

    const [cameraReady, setCameraReady] =
        useState(false);

    const [cameraError, setCameraError] =
        useState("");

    const [status, setStatus] = useState<
        "idle" |
        "loading" |
        "success" |
        "error"
    >("idle");

    const [lastToken, setLastToken] =
        useState("");

    const [isStarting, setIsStarting] =
        useState(false);

    // ======================================================
    // START CAMERA
    // ======================================================

    useEffect(() => {

        startScanner();

        return () => {

            stopScanner();

            clearTimeout(timeoutRef.current);

        };

    }, []);

    // ======================================================
    // START SCANNER
    // ======================================================

    const startScanner = async () => {

        try {
            const readerElement = document.getElementById("reader");

            if (readerElement) {
                readerElement.innerHTML = "";
            }

            // ======================================================
            // PREVENT MULTIPLE SCANNERS
            // ======================================================

            if (scannerRef.current) {

                try {

                    await scannerRef.current.stop();

                    await scannerRef.current.clear();

                } catch (e) {

                    console.log(e);

                }

            }

            setIsStarting(true);

            setCameraError("");

            // ======================================================
            // GET CAMERAS
            // ======================================================

            const cameras =
                await Html5Qrcode.getCameras();

            if (!cameras.length) {

                setCameraError(
                    "No camera device found"
                );

                toast.error(
                    "No camera available"
                );

                return;

            }

            // ======================================================
            // SELECT BACK CAMERA
            // ======================================================

            const backCamera =
                cameras.find((c) =>
                    c.label
                        .toLowerCase()
                        .includes("back")
                ) || cameras[0];

            // ======================================================
            // CREATE SCANNER
            // ======================================================

            const scanner =
                new Html5Qrcode("reader");

            scannerRef.current = scanner;

            // ======================================================
            // START CAMERA
            // ======================================================

            await scanner.start(

                backCamera.id,

                {
                    fps: 10,



                    aspectRatio: 1,

                    disableFlip: false,


                },

                // ======================================================
                // ON SCAN SUCCESS
                // ======================================================

                async (decodedText) => {

                    // =====================================
                    // PREVENT MULTIPLE RAPID SCANS
                    // =====================================

                    if (scanningLock.current)
                        return;

                    scanningLock.current = true;

                    try {

                        setStatus("loading");

                        // =====================================
                        // PARSE QR
                        // =====================================

                        const parsed =
                            JSON.parse(decodedText);

                        const token =
                            parsed?.token;

                        if (!token) {

                            throw new Error(
                                "Invalid QR format"
                            );

                        }

                        // =====================================
                        // PREVENT DUPLICATE TOKEN
                        // =====================================

                        if (lastToken === token) {

                            scanningLock.current =
                                false;

                            return;

                        }

                        setLastToken(token);

                        // =====================================
                        // API CALL
                        // =====================================

                        const result =
                            await dispatch(
                                verifyQrCode({

                                    token,

                                    gateName:
                                        "Main Gate",

                                    checkInDevice:
                                        navigator.userAgent,

                                })
                            ).unwrap();

                        // =====================================
                        // SUCCESS
                        // =====================================

                        if (result?.success) {

                            playSuccessSound();

                            setStatus("success");

                            toast.success(
                                "Check-in Successful"
                            );

                        } else {

                            throw new Error(
                                result?.message
                            );

                        }

                    } catch (err: any) {

                        // =====================================
                        // ERROR
                        // =====================================

                        playErrorSound();

                        setStatus("error");

                        toast.error(
                            err?.message ||
                            "Invalid QR"
                        );

                    }

                    // =====================================
                    // RESET LOCK
                    // =====================================

                    timeoutRef.current =
                        setTimeout(() => {

                            setStatus("idle");

                            scanningLock.current =
                                false;

                        }, 2500);

                },

                // ======================================================
                // ON SCAN ERROR
                // ======================================================

                () => { }

            );

            // ======================================================
            // CAMERA READY
            // ======================================================

            setCameraReady(true);

        } catch (err: any) {

            console.log(err);

            setCameraError(
                err?.message ||
                "Camera failed"
            );

            toast.error(
                "Unable to access camera"
            );

        } finally {

            setIsStarting(false);

        }

    };

    // ======================================================
    // STOP SCANNER
    // ======================================================

    const stopScanner = async () => {

        try {

            if (scannerRef.current) {

                // STOP CAMERA

                try {

                    await scannerRef.current.stop();

                } catch (e) {

                    console.log("Stop Error:", e);

                }

                // CLEAR SCANNER

                try {

                    await scannerRef.current.clear();

                } catch (e) {

                    console.log("Clear Error:", e);

                }

                // RESET REF

                scannerRef.current = null;

            }

            // REMOVE OLD VIDEO ELEMENTS

            const readerElement =
                document.getElementById("reader");

            if (readerElement) {

                readerElement.innerHTML = "";

            }

        } catch (err) {

            console.log(err);

        }

    };

    // ======================================================
    // RESET
    // ======================================================

    const handleReset = () => {

        dispatch(resetScannerState());

        setStatus("idle");

        setLastToken("");

        scanningLock.current = false;

    };

    // ======================================================
    // SOUND EFFECTS
    // ======================================================

    const playSuccessSound = () => {

        const audio = new Audio(
            "/sounds/success.mp3"
        );

        audio.volume = 0.7;

        audio.play();

    };

    const playErrorSound = () => {

        const audio = new Audio(
            "/sounds/error.mp3"
        );

        audio.volume = 0.7;

        audio.play();

    };

    // ======================================================
    // UI
    // ======================================================

    return (

        <div className="min-h-screen bg-[#050816] relative overflow-hidden flex items-center justify-center px-4 py-10">

            {/* ===================================== */}
            {/* BACKGROUND GLOW */}
            {/* ===================================== */}

            <div className="absolute top-[-150px] left-[-120px] w-[450px] h-[450px] bg-cyan-500/20 rounded-full blur-[120px]" />

            <div className="absolute bottom-[-150px] right-[-120px] w-[450px] h-[450px] bg-purple-600/20 rounded-full blur-[120px]" />

            {/* ===================================== */}
            {/* MAIN CARD */}
            {/* ===================================== */}

            <motion.div

                initial={{
                    opacity: 0,
                    scale: 0.9,
                    y: 40,
                }}

                animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                }}

                transition={{
                    duration: 0.4,
                }}

                className="relative z-10 w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-5 shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
            >

                {/* ===================================== */}
                {/* HEADER */}
                {/* ===================================== */}

                <div className="text-center mb-5">

                    <div className="flex justify-center items-center gap-2">

                        <ShieldCheck
                            size={24}
                            className="text-cyan-400"
                        />

                        <h1 className="text-2xl font-bold text-white">
                            Gate Check-in
                        </h1>

                    </div>

                    <p className="text-sm text-gray-400 mt-1">
                        Secure QR Verification System
                    </p>

                </div>

                {/* ===================================== */}
                {/* USER CARD */}
                {/* ===================================== */}

                <AnimatePresence>

                    {currentScan && (

                        <motion.div

                            initial={{
                                opacity: 0,
                                y: -15,
                            }}

                            animate={{
                                opacity: 1,
                                y: 0,
                            }}

                            exit={{
                                opacity: 0,
                            }}

                            className={clsx(
                                "mb-5 rounded-2xl p-4 border",

                                success
                                    ? "bg-green-500/10 border-green-500/20"
                                    : "bg-red-500/10 border-red-500/20"
                            )}
                        >

                            <div className="flex justify-between items-start">

                                <div>

                                    <h2 className="text-lg font-semibold text-white">
                                        {
                                            currentScan
                                                ?.investor
                                                ?.Full_Name
                                        }
                                    </h2>

                                    <p className="text-sm text-gray-300">
                                        {
                                            currentScan?.phone
                                        }
                                    </p>

                                </div>

                                <div>

                                    {success ? (

                                        <div className="text-green-400 text-xs font-semibold">
                                            VERIFIED
                                        </div>

                                    ) : (

                                        <div className="text-red-400 text-xs font-semibold">
                                            FAILED
                                        </div>

                                    )}

                                </div>

                            </div>

                            {/* EXTRA */}

                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">

                                <div className="bg-white/5 rounded-xl p-3">

                                    <p className="text-gray-400">
                                        Gate
                                    </p>

                                    <p className="text-white mt-1">
                                        Main Gate
                                    </p>

                                </div>

                                <div className="bg-white/5 rounded-xl p-3">

                                    <p className="text-gray-400">
                                        Time
                                    </p>

                                    <p className="text-white mt-1">
                                        {
                                            new Date()
                                                .toLocaleTimeString()
                                        }
                                    </p>

                                </div>

                            </div>

                        </motion.div>

                    )}

                </AnimatePresence>

                {/* ===================================== */}
                {/* SCANNER AREA */}
                {/* ===================================== */}

                <div className="relative overflow-hidden rounded-[30px] border border-cyan-500/20 bg-black/40 min-h-[360px]">

                    {/* CAMERA */}

                    <div
                        id="reader"
                        className="
            relative
            w-full
            h-[360px]
            overflow-hidden
            rounded-[30px]

            [&>video]:w-full
            [&>video]:h-full
            [&>video]:object-cover
            [&>video]:rounded-[30px]

            [&_img]:hidden

            [&>#reader__dashboard]:hidden

            [&>#reader__scan_region]:bg-transparent
        "
                    />

                    {/* ===================================== */}
                    {/* SCAN OVERLAY */}
                    {/* ===================================== */}

                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">

                        {/* DARK SHADE */}

                        <div className="absolute inset-0 bg-black/45" />

                        {/* SCAN AREA */}

                        <motion.div
                            animate={{
                                opacity: [0.7, 1, 0.7],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 2,
                            }}
                            className="relative w-[260px] h-[260px]"
                        >

                            {/* TRANSPARENT CUTOUT */}



                            {/* SCAN LINE */}

                            <motion.div
                                animate={{
                                    y: [0, 250, 0],
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "linear",
                                }}
                                className="
                    absolute
                    top-0
                    left-0
                    h-[3px]
                    w-full
                    bg-cyan-400
                    shadow-[0_0_20px_rgba(34,211,238,1)]
                "
                            />

                            {/* TOP LEFT */}

                            <div className="
                absolute
                top-0
                left-0
                w-10
                h-10
                border-l-4
                border-t-4
                border-cyan-300
                rounded-tl-2xl
            " />

                            {/* TOP RIGHT */}

                            <div className="
                absolute
                top-0
                right-0
                w-10
                h-10
                border-r-4
                border-t-4
                border-cyan-300
                rounded-tr-2xl
            " />

                            {/* BOTTOM LEFT */}

                            <div className="
                absolute
                bottom-0
                left-0
                w-10
                h-10
                border-l-4
                border-b-4
                border-cyan-300
                rounded-bl-2xl
            " />

                            {/* BOTTOM RIGHT */}

                            <div className="
                absolute
                bottom-0
                right-0
                w-10
                h-10
                border-r-4
                border-b-4
                border-cyan-300
                rounded-br-2xl
            " />

                        </motion.div>

                    </div>

                    {/* ===================================== */}
                    {/* STATUS OVERLAY */}
                    {/* ===================================== */}

                    <AnimatePresence>

                        {status !== "idle" && (

                            <motion.div

                                initial={{
                                    opacity: 0,
                                    scale: 0.7,
                                }}

                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                }}

                                exit={{
                                    opacity: 0,
                                    scale: 0.7,
                                }}

                                className="
                    absolute
                    inset-0
                    z-30
                    flex
                    items-center
                    justify-center
                    bg-black/60
                    backdrop-blur-sm
                "
                            >

                                {/* LOADING */}

                                {status === "loading" && (

                                    <div className="flex flex-col items-center">

                                        <Loader2
                                            size={70}
                                            className="animate-spin text-cyan-400"
                                        />

                                        <p className="mt-4 text-white font-medium">
                                            Verifying QR...
                                        </p>

                                    </div>

                                )}

                                {/* SUCCESS */}

                                {status === "success" && (

                                    <div className="flex flex-col items-center">

                                        <CheckCircle2
                                            size={90}
                                            className="text-green-400"
                                        />

                                        <p className="mt-4 text-lg font-semibold text-white">
                                            Access Granted
                                        </p>

                                    </div>

                                )}

                                {/* ERROR */}

                                {status === "error" && (

                                    <div className="flex flex-col items-center">

                                        <XCircle
                                            size={90}
                                            className="text-red-400"
                                        />

                                        <p className="mt-4 text-lg font-semibold text-white">
                                            Invalid QR
                                        </p>

                                    </div>

                                )}

                            </motion.div>

                        )}

                    </AnimatePresence>

                </div>

                {/* ===================================== */}
                {/* ERROR */}
                {/* ===================================== */}

                {cameraError && (

                    <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-300 text-sm">
                        {cameraError}
                    </div>

                )}

                {/* ===================================== */}
                {/* ACTIONS */}
                {/* ===================================== */}

                <div className="mt-5 grid grid-cols-2 gap-3">

                    <button

                        onClick={handleReset}

                        className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all"
                    >

                        <RotateCcw size={18} />

                        Reset

                    </button>

                    <button

                        onClick={() => {
                            stopScanner();
                            setTimeout(() => {
                                startScanner();
                            }, 500);
                        }}

                        className="h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold flex items-center justify-center gap-2 transition-all"
                    >

                        <ScanLine size={18} />

                        Restart Scan

                    </button>

                </div>

            </motion.div>

        </div>

    );

};

export default GateScannerUltra;