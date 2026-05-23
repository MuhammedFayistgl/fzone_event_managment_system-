import { createSlice } from "@reduxjs/toolkit";
import { fetchInvestorData } from "./ExtraSlice/InvestorExtraSlice";

const initialState = {
    data: [],
    total: 0,
    loading: false,
};


const InvestorsSlice = createSlice({
    name: "Investors",
    initialState,

    reducers: {
        setInvestors: (_state, _action) => { }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchInvestorData.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchInvestorData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.data;
                state.total = action.payload.total;
            })
            .addCase(fetchInvestorData.rejected, (state) => {
                state.loading = false;
            });
    }

})


export const { setInvestors } = InvestorsSlice.actions;

export default InvestorsSlice.reducer;