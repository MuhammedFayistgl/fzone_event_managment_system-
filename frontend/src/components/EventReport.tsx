import type { FC } from 'react';
import { Toggle } from 'rsuite';
import { HiOutlineDownload } from "react-icons/hi";

const EventReport: FC = () => {
    return (
        <div className="w-full space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-app-text">Event Report</h2>
            </div>

            <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-app-text text-app-base py-3 rounded-xl text-sm font-medium hover:opacity-90 transition"
            >
                <HiOutlineDownload className="text-lg" />
                Download Participant List (CSV)
            </button>

            <div className="pt-2">
                <p className="text-xs font-semibold text-app-muted tracking-wide">SETTINGS</p>
            </div>

            <div className="border-t border-app-border" />

            <div className="flex items-center justify-between">
                <p className="text-sm text-app-text">Close Registration</p>
                <Toggle />
            </div>
        </div>
    );
};

export default EventReport;
