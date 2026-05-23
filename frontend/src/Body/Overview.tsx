import { useEffect, type FC } from 'react';
import { Grid, Text } from 'rsuite';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../redux/store';
import { getDashboardSummary } from '../redux/store/slices/ExtraSlice/InvestorExtraSlice';
import DashboardCards from './DashboardCards';

import InvestorsTable from '../components/InvestorsTable';
import StaffTools from '../components/StaffTools';
import EventReport from '../components/EventReport';
import RecentRegistrationsContainer from '../components/ResentRegistration/RecentRegistrationsContainer';
import EventCardDashbord from '../components/running_eventCard/EventCardDashbord';




interface OverviewProps {

}

const Overview: FC<OverviewProps> = () => {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        dispatch(getDashboardSummary());
    }, [dispatch])



    return (
        <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">

                {/* Header */}
                <h1 className="text-2xl sm:text-3xl font-bold py-5">
                    Overview
                </h1>

                {/* Cards */}
                <DashboardCards />

                {/* Main Layout */}
                <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Section */}
                    <div className="lg:col-span-2 w-full">
                        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
                            {/* <InvestorsTable preview={true} /> */}
                            {/* <RecentRegistrationsContainer mode='preview' /> */}
                            <EventCardDashbord  />
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex flex-col gap-6 w-full">

                        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
                            <StaffTools />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
                            <EventReport />
                        </div>

                    </div>
                </div>
            </div>

            {/* Footer */}
            <p className="text-center text-gray-500 text-sm py-10">
                © 2026 FZone Annual Meet. All rights reserved.
            </p>
        </>
    );

}


export default Overview;
