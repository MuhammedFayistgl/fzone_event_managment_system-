
// ================= GUEST DETAILS =================

import {
    useAppDispatch,
    useAppSelector
} from "../../hooks/hooks";

import {
    Button,
    Input,
    Message,
    toaster
} from "rsuite";

import {
    addGuest,
    removeGuest,
    updateGuest
} from "../../redux/EventRegister";
import { deleteRegisteredGuest } from "../../redux/Thunks/EventRegistorThunk";

export const GuestDetails = () => {

    // ================= HOOKS =================

    const dispatch = useAppDispatch();

    const event = useAppSelector(
        (s: any) => s.event.singleEvent
    );

    const guests = useAppSelector(
        (s: any) => s.eventRegistor?.guests || []
    );

    const investor = useAppSelector(
        (s: any) => s.eventRegistor?.data || {}
    );
 
    // ================= VALUES =================

    const allowGuests = Boolean(
        event?.allowGuests
    );

    const maxGuests = Number(
        event?.maxPerUser || 0
    );

    const alreadyRegisteredGuests =
        investor?.participants?.length || 0;

    const totalGuestsCount =
        alreadyRegisteredGuests +
        guests.length;

    // ================= HIDE =================

    if (!allowGuests) {

        return null;

    }

    // ================= ADD =================

    const handleAddGuest = () => {

        if (
            totalGuestsCount >= maxGuests
        ) {

            toaster.push(
                <Message
                    type="warning"
                    closable
                >
                    Maximum {maxGuests} guests allowed
                </Message>,
                {
                    duration: 3000
                }
            );

            return;
        }

        dispatch(addGuest());

    };

    // ================= UPDATE =================

    const handleUpdateGuest = (
        index: number,
        key: string | any,
        value: any
    ) => {

        dispatch(
            updateGuest({
                index,
                key,
                value,
            })
        );

    };

    // ================= REMOVE =================

    const handleRemoveGuest = (
        index: number
    ) => {

        dispatch(removeGuest(index));

    };
    // ============ Delete One Gust in Server =========//
    const handleDeleteRegisteredGuest = async (
        index: number
    ) => {

        try {

            const registrationId =
                investor?.registration?._id;

            if (!registrationId) return;
            console.log('test registrationId')
            const phone =
                investor?.registration?.phone ||
                String(investor?.investor?.Phone_No ?? "");

            await dispatch(
                deleteRegisteredGuest({
                    registrationId,
                    guestIndex: index,
                    phone,
                })
            ).unwrap();

            toaster.push(
                <Message
                    type="success"
                    closable
                >
                    Guest deleted successfully
                </Message>,
                {
                    duration: 3000
                }
            );

        } catch (err: any) {

            toaster.push(
                <Message
                    type="error"
                    closable
                >
                    {err || "Delete failed"}
                </Message>,
                {
                    duration: 3000
                }
            );

        }

    };
    // ================= UI =================

    return (

        <div className="app-card p-6 space-y-5">

            {/* ================= HEADER ================= */}

            <div className="flex justify-between items-center gap-3 flex-wrap">

                <div>

                    <h2 className="text-xl font-bold text-app-text">
                        Guest Details
                    </h2>

                    <p className="text-sm text-app-muted mt-1">
                        {totalGuestsCount} / {maxGuests} Guests Added
                    </p>

                </div>

                <Button
                    appearance="primary"
                    color="green"
                    size="sm"
                    onClick={handleAddGuest}
                    disabled={
                        totalGuestsCount >= maxGuests
                    }
                >
                    + Add Guest
                </Button>

            </div>

            {/* ================= REGISTERED ================= */}

            {investor?.participants?.length > 0 && (

                <div className="space-y-3">

                    <h3 className="text-sm font-semibold text-app-secondary uppercase tracking-wide">
                        Already Registered Guests
                    </h3>

                    {investor.participants.map(
                        (p: any, index: number) => (

                            <div
                                key={p._id}
                                className="border border-emerald-500/30 bg-emerald-500/10 rounded-2xl p-4 flex justify-between items-center"
                            >

                                <div>

                                    <p className="font-semibold text-app-text">
                                        {p.name}
                                    </p>

                                    <p className="text-xs text-app-muted capitalize">
                                        {p.type}
                                    </p>

                                </div>

                                <div className="text-xs font-semibold text-emerald-400">
                                    Registered
                                </div>
                                <Button
                                    size="sm"
                                    appearance="ghost"
                                    color="red"

                                    onClick={() => handleDeleteRegisteredGuest(index)}
                                >
                                    Delete Guest
                                </Button>

                            </div>

                        )
                    )}

                </div>

            )}

            {/* ================= NEW GUESTS ================= */}

            <div className="space-y-4">

                {guests.map(
                    (g: any, i: number) => (

                        <div
                            key={g.id || i}
                            className="border border-app-border app-card-muted rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
                        >

                            {/* NAME */}

                            <Input
                                placeholder="Guest Name"
                                value={g.name}
                                onChange={(v: any) =>
                                    handleUpdateGuest(
                                        i,
                                        "name",
                                        v
                                    )
                                }
                            />

                            {/* PHONE */}

                            <Input
                                placeholder="Phone Number"
                                value={g.phone}
                                onChange={(v: any) =>
                                    handleUpdateGuest(
                                        i,
                                        "phone",
                                        v
                                    )
                                }
                            />

                            {/* RELATION */}

                            <select
                                className="app-input border rounded-lg px-3 py-2 outline-none"
                                value={g.relation}
                                onChange={(e) =>
                                    handleUpdateGuest(
                                        i,
                                        "relation",
                                        e.target.value
                                    )
                                }
                            >

                                <option value="wife">
                                    Wife
                                </option>

                                <option value="child">
                                    Child
                                </option>

                                <option value="friend">
                                    Friend
                                </option>

                                <option value="other">
                                    Other
                                </option>

                            </select>

                            {/* REMOVE */}

                            <div className="md:col-span-3">

                                <Button
                                    appearance="ghost"
                                    color="red"
                                    block
                                    onClick={() =>
                                        handleRemoveGuest(i)
                                    }
                                >
                                    Remove Guest
                                </Button>

                            </div>

                        </div>

                    )
                )}

            </div>

        </div>

    );

};
