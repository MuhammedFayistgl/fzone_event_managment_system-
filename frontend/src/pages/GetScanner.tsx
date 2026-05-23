

import {
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
import { getRegistrationInvestorName } from "../utils/getRegistrationInvestorName";



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
    // CLEANUP ON UNMOUNT (camera must start via user tap on mobile)
    // ======================================================

    useEffect(() => {
        return () => {
            stopScanner();
            clearTimeout(timeoutRef.current);
        };
    }, []);

    const getCameraErrorMessage = (err: unknown) => {
        const message =
            err instanceof Error ? err.message : "Camera failed";

        if (!window.isSecureContext) {
            return "Camera needs HTTPS. Open https:// (not http://) and accept the security warning once.";
        }

        if (/NotAllowedError|Permission/i.test(message)) {
            return "Camera permission denied. Allow camera in browser settings and tap Open Camera again.";
        }

        if (/NotFoundError|No camera/i.test(message)) {
            return "No camera found on this device.";
        }

        return message;
    };

    const qrScanConfig = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
            return { width: size, height: size };
        },
    };

    // ======================================================
    // START SCANNER
    // ======================================================

    const startScanner = async () => {

        try {
            if (!window.isSecureContext) {
                setCameraError(getCameraErrorMessage(new Error("insecure")));
                toast.error("Use https:// URL for camera on mobile");
                return;
            }

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
            setCameraReady(false);

            const scanner =
                new Html5Qrcode("reader");

            scannerRef.current = scanner;

            const onScanSuccess = async (decodedText: string) => {
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

                };

            const tryStart = async (cameraIdOrConfig: string | { facingMode: string }) => {
                await scanner.start(
                    cameraIdOrConfig,
                    qrScanConfig,
                    onScanSuccess,
                    () => { }
                );
            };

            // Mobile: back camera via facingMode (works before labels are available)
            try {
                await tryStart({ facingMode: "environment" });
            } catch {
                const cameras = await Html5Qrcode.getCameras();
                if (!cameras.length) {
                    throw new Error("No camera device found");
                }

                const backCamera =
                    cameras.find((c) =>
                        /back|rear|environment/i.test(c.label)
                    ) || cameras[cameras.length - 1];

                await tryStart(backCamera.id);
            }

            setCameraReady(true);

        } catch (err: unknown) {

            console.log(err);

            const msg = getCameraErrorMessage(err);
            setCameraError(msg);

            toast.error("Unable to access camera");

        } finally {

            setIsStarting(false);

        }

    };

    const handleOpenCamera = () => {
        void startScanner();
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

        <div className="relative min-h-[calc(100vh-56px)] overflow-hidden flex items-center justify-center px-4 py-10">

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

                className="relative z-10 w-full max-w-md rounded-[32px] border border-app-border-strong app-card-raised p-5"
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

                        <h1 className="text-2xl font-bold text-app-text">
                            Gate Check-in
                        </h1>

                    </div>

                    <p className="text-sm text-app-muted mt-1">
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

                                    <h2 className="text-lg font-semibold text-app-text">
                                        {getRegistrationInvestorName(currentScan)}
                                    </h2>

                                    <p className="text-sm text-app-muted">
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

                                <div className="bg-app-surface-muted rounded-xl p-3">

                                    <p className="text-app-muted">
                                        Gate
                                    </p>

                                    <p className="text-app-text mt-1">
                                        Main Gate
                                    </p>

                                </div>

                                <div className="bg-app-surface-muted rounded-xl p-3">

                                    <p className="text-app-muted">
                                        Time
                                    </p>

                                    <p className="text-app-text mt-1">
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

                    {/* Tap to open — required on mobile (user gesture + HTTPS) */}
                    {!cameraReady && (
                        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
                            {isStarting ? (
                                <>
                                    <Loader2
                                        size={48}
                                        className="animate-spin text-cyan-400"
                                    />
                                    <p className="mt-4 text-app-text text-sm">
                                        Opening camera...
                                    </p>
                                </>
                            ) : (
                                <>
                                    <ScanLine
                                        size={48}
                                        className="text-cyan-400 mb-4"
                                    />
                                    <p className="text-app-text text-sm mb-1">
                                        Camera is off until you allow access
                                    </p>
                                    <p className="text-app-muted text-xs mb-5 max-w-[260px]">
                                        On phone use{" "}
                                        <span className="text-cyan-300">https://</span>{" "}
                                        URL (not http)
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleOpenCamera}
                                        className="h-12 px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-app-base font-semibold flex items-center justify-center gap-2 transition-all"
                                    >
                                        <ScanLine size={18} />
                                        Open Camera
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ===================================== */}
                    {/* SCAN OVERLAY */}
                    {/* ===================================== */}

                    {cameraReady && (
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
                    )}

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

                                        <p className="mt-4 text-app-text font-medium">
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

                                        <p className="mt-4 text-lg font-semibold text-app-text">
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

                                        <p className="mt-4 text-lg font-semibold text-app-text">
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

                        className="h-12 rounded-2xl bg-app-surface-muted hover:bg-app-surface border border-app-border text-app-text text-sm font-medium flex items-center justify-center gap-2 transition-all"
                    >

                        <RotateCcw size={18} />

                        Reset

                    </button>

                    <button

                        onClick={() => {
                            setCameraReady(false);
                            stopScanner();
                            setTimeout(() => {
                                void startScanner();
                            }, 500);
                        }}

                        className="h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-app-base font-semibold flex items-center justify-center gap-2 transition-all"
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