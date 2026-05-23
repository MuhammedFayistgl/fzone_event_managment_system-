import type { FC } from 'react';
import { Toggle } from 'rsuite';
import { HiOutlineDownload } from "react-icons/hi";

const EventReport: FC = () => {
    return (
        <div className="w-full flex justify-center mt-8">

            {/* CARD */}
            <div className="
        w-full max-w-lg
        bg-white
        rounded-2xl
        border border-gray-200
        shadow-sm
        hover:shadow-md
        transition-all duration-300
        p-6
        space-y-5
      ">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Event Report
                    </h2>
                </div>

                {/* DOWNLOAD BUTTON */}
                <button
                    className="
            w-full
            flex items-center justify-center gap-2
            bg-gray-900 text-white
            py-3 rounded-xl
            text-sm font-medium
            hover:bg-black
            transition
          "
                >
                    <HiOutlineDownload className="text-lg" />
                    Download Participant List (CSV)
                </button>

                {/* SETTINGS HEADER */}
                <div className="pt-2">
                    <p className="text-xs font-semibold text-gray-500 tracking-wide">
                        SETTINGS
                    </p>
                </div>

                {/* DIVIDER */}
                <div className="border-t border-gray-200"></div>

                {/* TOGGLE ROW */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                        Close Registration
                    </p>

                    <Toggle />
                </div>

            </div>
        </div>
    );
};

export default EventReport;