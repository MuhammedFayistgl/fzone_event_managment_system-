import { useEffect, type FC } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../redux/store';
import { getDashboardSummary } from '../redux/store/slices/ExtraSlice/InvestorExtraSlice';
import { useLiveDashboardSync } from '../hooks/useLiveDashboardSync';
import DashboardCards from './DashboardCards';
import DashboardAudienceBreakdown from './DashboardAudienceBreakdown';
import RecentRegistrationsContainer from "../components/ResentRegistration/RecentRegistrationsContainer";
import StaffTools from '../components/StaffTools';
import EventCardDashbord from '../components/running_eventCard/EventCardDashbord';
import AppPageLayout from '../layouts/AppPageLayout';
import { RecentAlertsWidget } from '../features/notifications/components/RecentAlertsWidget';

interface OverviewProps { }

const Overview: FC<OverviewProps> = () => {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        dispatch(getDashboardSummary());
    }, [dispatch]);

    useLiveDashboardSync(true);

    return (
        <AppPageLayout title="Overview" embedded>
            <DashboardCards />
            <DashboardAudienceBreakdown />
            <div className="mt-5">
                <RecentRegistrationsContainer mode="preview" />
            </div>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 w-full">
                    <div className="app-card-raised p-4 sm:p-6">
                        <EventCardDashbord />
                    </div>
                </div>

                <div className="flex flex-col gap-6 w-full">
                    <div className="app-card-raised p-4 sm:p-6">
                        <RecentAlertsWidget />
                    </div>
                    <div className="app-card-raised p-4 sm:p-6">
                        <StaffTools />
                    </div>
                </div>
            </div>

            <p className="text-center text-app-muted text-sm py-10">
                © 2026 FZone Annual Meet. All rights reserved.
            </p>
        </AppPageLayout>
    );
}

export default Overview;
