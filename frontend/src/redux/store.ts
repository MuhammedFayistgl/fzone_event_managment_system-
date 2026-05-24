import { configureStore } from '@reduxjs/toolkit'
import InvestorsSlice from './store/slices/InvestorsSlice';
import summarySlice from './store/slices/summarySlice.ts';
import adminSlice from './store/slices/adminLoginSlice.ts';
import eventSlice from './EventSlice.ts'
import eventRegistorSlice from './EventRegister.ts';
import paymentSlice from './paymentSlice.ts';
import paymentLedgerReducer from './Slice/paymentLedgerSlice.ts';
import RunningEventsSlice from './RunningEventsSlice.ts'
import EventRegistrationDatas from './Slice/EventRegistrationDatas.ts'
import qrScannerSlice from './Slice/qrScannerSlice.ts'
import themeSlice from './store/slices/themeSlice.ts'

export const store = configureStore({
    reducer: {
        Investors: InvestorsSlice,
        summary: summarySlice,
        admin: adminSlice,
        event: eventSlice,
        eventRegistor: eventRegistorSlice,
        payment: paymentSlice,
        paymentLedger: paymentLedgerReducer,
        runninEvents: RunningEventsSlice,
        eventRegistorData: EventRegistrationDatas,
        scanner : qrScannerSlice,
        theme: themeSlice,
    },
})
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;