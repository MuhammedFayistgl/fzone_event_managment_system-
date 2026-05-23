import type { FC } from 'react';
import { FaUsersGear } from "react-icons/fa6";
import { useNavigate } from 'react-router';

const StaffTools: FC = () => {
    const navigation = useNavigate();

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
      ">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">

                        <div className="
              w-10 h-10
              flex items-center justify-center
              rounded-xl
              bg-gray-100
            ">
                            <FaUsersGear className="text-gray-700 text-lg" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Staff Tools
                            </h2>
                            <p className="text-xs text-gray-500">
                                Manage staff operations efficiently
                            </p>
                        </div>

                    </div>
                </div>

                {/* BUTTON LIST */}
                <div className="flex flex-col divide-y">

                    {/* ITEM */}
                    <button
                        onClick={() => navigation('/user-management')}
                        className="
              flex items-center justify-between
              py-3
              px-2
              hover:bg-gray-50
              transition
              group
            "
                    >
                        <div className="flex items-center gap-3">
                            <FaUsersGear className="text-gray-400 group-hover:text-blue-600 transition" />
                            <span className="text-sm font-medium text-gray-700">
                                User Management (IDs)
                            </span>
                        </div>

                        <span className="text-gray-400 group-hover:text-blue-600">→</span>
                    </button>

                    {/* ITEM */}
                    <button
                        onClick={() => navigation('/gate-scanner')}
                        className="
              flex items-center justify-between
              py-3
              px-2
              hover:bg-gray-50
              transition
              group
            "
                    >
                        <div className="flex items-center gap-3">
                            <FaUsersGear className="text-gray-400 group-hover:text-blue-600 transition" />
                            <span className="text-sm font-medium text-gray-700">
                                Gate Scanner App
                            </span>
                        </div>

                        <span className="text-gray-400 group-hover:text-blue-600">→</span>
                    </button>

                    {/* ITEM */}
                    <button
                        onClick={() => navigation('/attendance-logs')}
                        className="
              flex items-center justify-between
              py-3
              px-2
              hover:bg-gray-50
              transition
              group
            "
                    >
                        <div className="flex items-center gap-3">
                            <FaUsersGear className="text-gray-400 group-hover:text-blue-600 transition" />
                            <span className="text-sm font-medium text-gray-700">
                                Attendance Logs
                            </span>
                        </div>

                        <span className="text-gray-400 group-hover:text-blue-600">→</span>
                    </button>

                    {/* ITEM */}
                    <button
                        onClick={() => navigation('/event')}
                        className="
              flex items-center justify-between
              py-3
              px-2
              hover:bg-gray-50
              transition
              group
            "
                    >
                        <div className="flex items-center gap-3">
                            <FaUsersGear className="text-gray-400 group-hover:text-blue-600 transition" />
                            <span className="text-sm font-medium text-gray-700">
                                Create Event
                            </span>
                        </div>

                        <span className="text-gray-400 group-hover:text-blue-600">→</span>
                    </button>

                </div>

            </div>
        </div>
    );
};

export default StaffTools;