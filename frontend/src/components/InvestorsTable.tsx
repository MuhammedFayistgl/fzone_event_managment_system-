import { useCallback, useEffect, useMemo, useState } from "react";
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from "material-react-table";
import {
    IconButton,
    Button,
    Tooltip,
    Box,
    Avatar,
    Chip,
    MenuItem,
    Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddIcon from "@mui/icons-material/Add";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import { Search, Users, UserRound, UserCircle2, Sparkles, X, SlidersHorizontal } from "lucide-react";
import { Input, InputGroup } from "rsuite";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../redux/store";
import {
    createInvestorData,
    deleteInvestorData,
    fetchInvestorData,
    getDashboardSummary,
    updateInvestorData,
} from "../redux/store/slices/ExtraSlice/InvestorExtraSlice";
import { useNavigate } from "react-router-dom";
import { Text } from "rsuite";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { format } from "date-fns";
import AppPageLayout from "../layouts/AppPageLayout";
import { useAppSelector } from "../hooks/hooks";

export type InvestorGender = "Male" | "Female" | "Other";

const GENDER_OPTIONS: InvestorGender[] = ["Male", "Female", "Other"];

type InvestorRow = {
    _id: string;
    No: number;
    Code_No: string;
    Name: string;
    Phone_No: number | string;
    Gender: InvestorGender;
    createdAt?: string;
    updatedAt?: string;
};

type GenderStats = {
    totalInvestors: number;
    maleCount: number;
    femaleCount: number;
    otherCount: number;
};

const formatPhoneDisplay = (phone: number | string) => {
    const digits = String(phone).replace(/\D/g, "");
    if (digits.length === 10) {
        return `${digits.slice(0, 5)}\u00A0${digits.slice(5)}`;
    }
    return String(phone);
};

/** createdAt missing on imported rows — fall back to MongoDB _id timestamp */
const getInvestorJoinedDate = (row: Pick<InvestorRow, "_id" | "createdAt">): Date | null => {
    if (row.createdAt) {
        const fromField = new Date(row.createdAt);
        if (!Number.isNaN(fromField.getTime())) return fromField;
    }
    const hex = row._id?.slice(0, 8);
    if (hex && /^[a-f0-9]{8}$/i.test(hex)) {
        return new Date(parseInt(hex, 16) * 1000);
    }
    return null;
};

const validateInvestor = (values: Partial<InvestorRow>) => {
    const errors: Record<string, string> = {};
    if (!values.Code_No?.toString().trim()) errors.Code_No = "Code is required";
    if (!values.Name?.toString().trim()) errors.Name = "Name is required";
    if (!values.Gender || !GENDER_OPTIONS.includes(values.Gender as InvestorGender)) {
        errors.Gender = "Gender is required";
    }
    const phone = String(values.Phone_No ?? "").replace(/\D/g, "");
    if (!phone) errors.Phone_No = "Phone is required";
    else if (phone.length !== 10) errors.Phone_No = "Phone must be 10 digits";
    return errors;
};

const exportToCSV = (rows: InvestorRow[]) => {
    const headers = ["No", "Code_No", "Name", "Phone_No", "Gender"];
    const csv = [
        headers.join(","),
        ...rows.map((row) =>
            [
                row.No ?? "",
                row.Code_No,
                `"${String(row.Name).replace(/"/g, '""')}"`,
                row.Phone_No,
                row.Gender || "Other",
            ].join(",")
        ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "investors.csv";
    a.click();
};

const GenderBadge = ({ gender }: { gender: InvestorGender | string }) => {
    const value = (gender || "Other") as InvestorGender;
    const styles: Record<
        InvestorGender,
        { bg: string; color: string; border: string }
    > = {
        Male: {
            bg: "rgba(34, 211, 238, 0.15)",
            color: "#22d3ee",
            border: "rgba(34, 211, 238, 0.35)",
        },
        Female: {
            bg: "rgba(192, 132, 252, 0.15)",
            color: "#c084fc",
            border: "rgba(192, 132, 252, 0.35)",
        },
        Other: {
            bg: "rgba(161, 161, 170, 0.15)",
            color: "#a1a1aa",
            border: "rgba(161, 161, 170, 0.35)",
        },
    };
    const style = styles[value] || styles.Other;
    return (
        <Chip
            label={value}
            size="small"
            sx={{
                fontWeight: 600,
                fontSize: "11px",
                backgroundColor: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
            }}
        />
    );
};

const StatChip = ({
    label,
    value,
    icon: Icon,
    variant = "total",
    delay = 0,
}: {
    label: string;
    value: number;
    icon: typeof Users;
    variant?: "total" | "male" | "female" | "other";
    delay?: number;
}) => (
    <div
        className={`pro-stat-card registration-stat-card investors-stat-card investors-stat-card--${variant} pro-animate-in`}
        style={{ ["--pro-delay" as string]: `${delay}ms` }}
    >
        <div className="pro-stat-card__icon-wrap" aria-hidden>
            <Icon size={16} />
        </div>
        <div className="pro-stat-card__body">
            <p className="pro-stat-card__label">{label}</p>
            <p className="investors-stat-value pro-stat-card__value tabular-nums">{value.toLocaleString()}</p>
        </div>
        <span className="pro-stat-card__glow" aria-hidden />
    </div>
);

export default function InvestorsTable({ preview }: { preview?: boolean }) {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const isDark = useAppSelector((s) => s.theme.mode) === "dark";

    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilterInput, setGlobalFilterInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sorting, setSorting] = useState<any>([]);
    const [rowSelection, setRowSelection] = useState({});
    const [genderFilter, setGenderFilter] = useState<string>("");
    const [genderStats, setGenderStats] = useState<GenderStats>({
        totalInvestors: 0,
        maleCount: 0,
        femaleCount: 0,
        otherCount: 0,
    });

    const investorState = useSelector((state: any) => state.Investors);
    const data: InvestorRow[] = investorState?.data || [];
    const total = investorState?.total || 0;
    const loading = investorState?.loading;

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(globalFilterInput.trim()), 300);
        return () => clearTimeout(timer);
    }, [globalFilterInput]);

    useEffect(() => {
        if (preview) return;
        setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, [debouncedSearch, genderFilter, preview]);

    const loadInvestors = useCallback(() => {
        dispatch(
            fetchInvestorData({
                page: pagination.pageIndex + 1,
                limit: preview ? 10 : pagination.pageSize,
                search: debouncedSearch,
                sortBy: sorting[0]?.id || "createdAt",
                sortOrder: sorting.length
                    ? sorting[0]?.desc
                        ? "desc"
                        : "asc"
                    : "desc",
                gender: genderFilter,
            })
        );
    }, [
        dispatch,
        pagination.pageIndex,
        pagination.pageSize,
        debouncedSearch,
        sorting,
        genderFilter,
        preview,
    ]);

    useEffect(() => {
        if (preview) return;
        loadInvestors();
    }, [loadInvestors, preview]);

    useEffect(() => {
        if (preview) return;
        dispatch(getDashboardSummary())
            .unwrap()
            .then((res: any) => {
                setGenderStats({
                    totalInvestors: res?.totalInvestors ?? 0,
                    maleCount: res?.maleCount ?? 0,
                    femaleCount: res?.femaleCount ?? 0,
                    otherCount: res?.otherCount ?? 0,
                });
            })
            .catch(() => {});
    }, [dispatch, preview, total]);

    const previewData = preview ? data.slice(0, 10) : data;

    const refetch = () => {
        loadInvestors();
        if (!preview) {
            dispatch(getDashboardSummary())
                .unwrap()
                .then((res: any) => {
                    setGenderStats({
                        totalInvestors: res?.totalInvestors ?? 0,
                        maleCount: res?.maleCount ?? 0,
                        femaleCount: res?.femaleCount ?? 0,
                        otherCount: res?.otherCount ?? 0,
                    });
                })
                .catch(() => {});
        }
    };

    const handleSaveInvestor = async (
        values: Partial<InvestorRow>,
        mode: "create" | "edit",
        rowId?: string,
        table?: any
    ) => {
        const errors = validateInvestor(values);
        if (Object.keys(errors).length > 0) {
            toast.error(Object.values(errors)[0]);
            return false;
        }

        const payload = {
            Code_No: String(values.Code_No).trim().toUpperCase(),
            Name: String(values.Name).trim(),
            Phone_No: String(values.Phone_No).replace(/\D/g, ""),
            Gender: values.Gender as InvestorGender,
        };

        try {
            if (mode === "create") {
                const res = await dispatch(createInvestorData(payload)).unwrap();
                toast.success(
                    res?.genderCorrected
                        ? `Investor added — gender set to ${res?.data?.Gender ?? payload.Gender} from name`
                        : "Investor added"
                );
                table?.setCreatingRow(null);
            } else if (rowId) {
                await dispatch(
                    updateInvestorData({ id: rowId, data: payload })
                ).unwrap();
                toast.success("Updated successfully");
                table?.setEditingRow(null);
            }
            refetch();
            return true;
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Save failed";
            toast.error(message);
            return false;
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: "Delete?",
            text: "This cannot be undone",
            icon: "warning",
            showCancelButton: true,
        });
        if (!result.isConfirmed) return;

        try {
            await dispatch(deleteInvestorData(id)).unwrap();
            toast.success("Deleted");
            refetch();
        } catch {
            toast.error("Delete failed");
        }
    };

    const handleBulkDelete = async (rows: InvestorRow[]) => {
        if (rows.length === 0) {
            toast.error("No rows selected");
            return;
        }
        const result = await Swal.fire({
            title: `Delete ${rows.length} investor(s)?`,
            text: "This cannot be undone",
            icon: "warning",
            showCancelButton: true,
        });
        if (!result.isConfirmed) return;

        try {
            await Promise.all(
                rows.map((row) => dispatch(deleteInvestorData(row._id)).unwrap())
            );
            toast.success(`${rows.length} deleted`);
            setRowSelection({});
            refetch();
        } catch {
            toast.error("Bulk delete failed");
        }
    };

    const columns = useMemo<MRT_ColumnDef<InvestorRow>[]>(
        () => [
            {
                accessorKey: "No",
                header: "No",
                size: 56,
                minSize: 56,
                maxSize: 56,
                grow: 0,
                enableEditing: false,
                muiTableHeadCellProps: { align: "center" },
                muiTableBodyCellProps: { align: "center" },
            },
            {
                accessorKey: "Code_No",
                header: "Code",
                size: 104,
                minSize: 104,
                maxSize: 104,
                grow: 0,
                muiEditTextFieldProps: { required: true },
                Cell: ({ cell, row }) => {
                    const isNew =
                        row.original.createdAt &&
                        new Date(row.original.createdAt).getTime() >
                            Date.now() - 1000 * 60 * 60 * 24;
                    return (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                maxWidth: "100%",
                                overflow: "hidden",
                            }}
                        >
                            <Typography
                                variant="body2"
                                noWrap
                                sx={{
                                    fontFamily: "ui-monospace, monospace",
                                    fontWeight: 700,
                                    fontSize: "12px",
                                    letterSpacing: "0.02em",
                                    color: isDark ? "var(--color-text-primary)" : undefined,
                                }}
                            >
                                {cell.getValue<string>()}
                            </Typography>
                            {isNew && (
                                <Chip
                                    label="NEW"
                                    size="small"
                                    sx={{
                                        height: 18,
                                        fontSize: "9px",
                                        fontWeight: 700,
                                        flexShrink: 0,
                                        backgroundColor: "rgba(34, 197, 94, 0.2)",
                                        color: "#22c55e",
                                    }}
                                />
                            )}
                        </Box>
                    );
                },
            },
            {
                accessorKey: "Name",
                header: "Name",
                size: 176,
                minSize: 176,
                maxSize: 176,
                grow: 0,
                muiEditTextFieldProps: { required: true },
                Cell: ({ row }) => (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            minWidth: 0,
                            maxWidth: "100%",
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 30,
                                height: 30,
                                fontSize: "12px",
                                fontWeight: 700,
                                flexShrink: 0,
                                background:
                                    row.original.Gender === "Female"
                                        ? "linear-gradient(135deg, #c084fc, #a855f7)"
                                        : row.original.Gender === "Male"
                                          ? "linear-gradient(135deg, #22d3ee, #0891b2)"
                                          : "linear-gradient(135deg, #71717a, #52525b)",
                            }}
                        >
                            {row.original.Name?.charAt(0)?.toUpperCase() || "?"}
                        </Avatar>
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            title={row.original.Name}
                            sx={{
                                minWidth: 0,
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: isDark ? "var(--color-text-primary)" : undefined,
                            }}
                        >
                            {row.original.Name}
                        </Typography>
                    </Box>
                ),
            },
            {
                accessorKey: "Phone_No",
                header: "Phone",
                size: 122,
                minSize: 122,
                maxSize: 122,
                grow: 0,
                muiEditTextFieldProps: {
                    required: true,
                    type: "tel",
                    inputProps: { maxLength: 10 },
                },
                Cell: ({ cell }) => (
                    <Typography
                        variant="body2"
                        noWrap
                        sx={{
                            fontFamily: "ui-monospace, monospace",
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                            color: isDark ? "var(--color-text-secondary)" : undefined,
                        }}
                    >
                        {formatPhoneDisplay(cell.getValue<number | string>())}
                    </Typography>
                ),
            },
            {
                accessorKey: "Gender",
                header: "Gender",
                size: 98,
                minSize: 98,
                maxSize: 98,
                grow: 0,
                filterVariant: "select",
                filterSelectOptions: GENDER_OPTIONS,
                editVariant: "select",
                editSelectOptions: GENDER_OPTIONS,
                muiEditTextFieldProps: {
                    required: true,
                    select: true,
                    children: GENDER_OPTIONS.map((g) => (
                        <MenuItem key={g} value={g}>
                            {g}
                        </MenuItem>
                    )),
                },
                Cell: ({ cell }) => (
                    <GenderBadge gender={cell.getValue<InvestorGender>() || "Other"} />
                ),
            },
            {
                accessorKey: "createdAt",
                header: "Joined",
                size: 178,
                minSize: 178,
                maxSize: 178,
                grow: 0,
                enableEditing: false,
                muiTableHeadCellProps: {
                    sx: {
                        whiteSpace: "nowrap",
                    },
                },
                muiTableBodyCellProps: {
                    sx: {
                        whiteSpace: "nowrap",
                        overflow: "visible",
                    },
                },
                Cell: ({ row }) => {
                    const joined = getInvestorJoinedDate(row.original);
                    const formatted = joined ? format(joined, "dd MMM yyyy, HH:mm") : "—";
                    return (
                        <Typography
                            variant="body2"
                            noWrap
                            title={formatted}
                            sx={{
                                fontSize: "12px",
                                fontFamily: "ui-monospace, monospace",
                                letterSpacing: "0.01em",
                                whiteSpace: "nowrap",
                                color: isDark ? "var(--color-text-muted)" : undefined,
                            }}
                        >
                            {formatted}
                        </Typography>
                    );
                },
            },
        ],
        [isDark]
    );

    const table = useMaterialReactTable({
        columns,
        data: previewData,
        getRowId: (row) => row._id,

        layoutMode: "semantic",
        enableColumnResizing: false,
        displayColumnDefOptions: {
            "mrt-row-select": {
                size: 50,
                minSize: 50,
                maxSize: 50,
                grow: 0,
                muiTableHeadCellProps: { align: "center", sx: { px: 1 } },
                muiTableBodyCellProps: { align: "center", sx: { px: 1 } },
            },
            "mrt-row-actions": {
                size: 88,
                minSize: 88,
                maxSize: 88,
                grow: 0,
                muiTableHeadCellProps: { align: "center", sx: { px: 1 } },
                muiTableBodyCellProps: { align: "center", sx: { px: 1 } },
            },
        },
        defaultColumn: {
            grow: 0,
            enableResizing: false,
        },

        muiTablePaperProps: {
            elevation: 0,
            className: isDark ? "investors-table-paper" : undefined,
            sx: {
                borderRadius: 0,
                border: "none",
                overflow: "hidden",
                backgroundColor: "transparent",
                boxShadow: "none",
            },
        },
        muiTableProps: {
            className: "investors-mrt-table",
            sx: {
                tableLayout: "fixed",
                width: "100%",
                minWidth: 872,
            },
        },
        muiTableHeadRowProps: {
            className: "pro-table-head-row",
        },
        muiTableHeadCellProps: {
            className: "pro-table-head-cell",
            sx: {
                px: 1.5,
                py: 1.25,
                whiteSpace: "nowrap",
                backgroundColor: isDark
                    ? "transparent"
                    : "var(--color-bg-surface-muted)",
                fontWeight: 700,
                fontSize: isDark ? "11px" : "12px",
                letterSpacing: isDark ? "0.08em" : "0.04em",
                textTransform: "uppercase",
                color: isDark ? "#d4d4d8" : "var(--color-text-primary)",
                borderBottom: isDark
                    ? "1px solid rgba(34, 211, 238, 0.18)"
                    : "1px solid var(--color-border-strong)",
                verticalAlign: "middle",
                "& .MuiTableSortLabel-root": {
                    color: isDark ? "#d4d4d8" : "var(--color-text-primary)",
                },
                "& .MuiTableSortLabel-root.Mui-active": {
                    color: isDark ? "#22d3ee" : "var(--color-accent-primary)",
                },
                "& .MuiTableSortLabel-icon": {
                    color: isDark ? "rgba(34, 211, 238, 0.7) !important" : undefined,
                },
                "& .MuiCheckbox-root": {
                    color: isDark ? "#71717a" : undefined,
                },
            },
        },
        muiTableBodyRowProps: ({ row }) => ({
            sx: {
                backgroundColor: isDark
                    ? row.index % 2 === 1
                        ? "rgba(255,255,255,0.02)"
                        : "transparent"
                    : "var(--color-bg-surface)",
                "&:hover": {
                    backgroundColor: isDark
                        ? "rgba(34,211,238,0.06)"
                        : "var(--color-card-hover)",
                },
                "&.Mui-selected": {
                    backgroundColor: "var(--color-selected-bg) !important",
                },
                "&.Mui-selected:hover": {
                    backgroundColor: isDark
                        ? "rgba(34,211,238,0.12) !important"
                        : "var(--color-selected-bg) !important",
                },
            },
        }),
        muiTableBodyCellProps: {
            sx: {
                px: 1.5,
                py: 1.1,
                fontSize: "13px",
                color: "var(--color-text-primary)",
                borderBottom: isDark ? "1px solid var(--color-border)" : undefined,
                verticalAlign: "middle",
            },
        },
        muiSearchTextFieldProps: {
            size: "small",
            variant: "outlined",
            placeholder: "Search name, code, phone, gender…",
            sx: {
                minWidth: { xs: 180, sm: 280 },
                "& .MuiOutlinedInput-root": {
                    backgroundColor: isDark ? "var(--color-bg-input)" : undefined,
                    borderRadius: "12px",
                },
            },
            inputProps: {
                "aria-label": "Search investors",
            },
        },
        muiSelectCheckboxProps: {
            sx: {
                color: isDark ? "var(--color-text-muted)" : undefined,
                "&.Mui-checked": {
                    color: isDark ? "var(--color-accent-cyan)" : undefined,
                },
            },
        },
        muiTopToolbarProps: {
            sx: {
                backgroundColor: isDark ? "rgba(0, 0, 0, 0.28)" : "var(--color-bg-surface)",
                borderBottom: "1px solid var(--color-border-strong)",
                px: { xs: 1.5, sm: 2 },
                py: 1.25,
                flexWrap: "wrap",
                gap: 1,
                backdropFilter: isDark ? "blur(12px)" : undefined,
            },
        },
        muiBottomToolbarProps: {
            sx: {
                borderTop: "1px solid var(--color-border-strong)",
                backgroundColor: isDark ? "rgba(0, 0, 0, 0.22)" : "var(--color-bg-surface)",
                backdropFilter: isDark ? "blur(12px)" : undefined,
            },
        },
        muiTableContainerProps: {
            sx: {
                maxHeight: preview ? undefined : "calc(100vh - 26rem)",
                overflowX: "auto",
                scrollbarWidth: "thin",
                scrollbarColor: isDark
                    ? "var(--color-scrollbar) transparent"
                    : undefined,
            },
        },
        enableTopToolbar: false,
        enableStickyHeader: !preview,

        enableEditing: !preview,
        createDisplayMode: "modal",
        editDisplayMode: "modal",
        positionActionsColumn: "last",

        onEditingRowSave: async ({ values, row, table: tbl }) => {
            const ok = await handleSaveInvestor(values, "edit", row.original._id, tbl);
            if (!ok) throw new Error("Save failed");
        },
        onCreatingRowSave: async ({ values, table: tbl }) => {
            const ok = await handleSaveInvestor(values, "create", undefined, tbl);
            if (!ok) throw new Error("Save failed");
        },

        enableColumnFilters: !preview,
        enableGlobalFilter: !preview,
        enableRowSelection: !preview,
        onRowSelectionChange: setRowSelection,

        enableDensityToggle: !preview,
        enableFullScreenToggle: !preview,
        enableColumnPinning: !preview,
        enableHiding: !preview,

        manualPagination: !preview,
        manualSorting: !preview,
        manualFiltering: !preview,

        rowCount: preview ? previewData.length : total,

        state: {
            pagination,
            globalFilter: globalFilterInput,
            sorting,
            rowSelection,
            isLoading: loading,
            showProgressBars: loading,
        },

        onPaginationChange: preview ? undefined : setPagination,
        onGlobalFilterChange: preview ? undefined : setGlobalFilterInput,
        onSortingChange: preview ? undefined : setSorting,

        renderEmptyRowsFallback: () => (
            <Box sx={{ py: 6, textAlign: "center", color: "var(--color-text-muted)" }}>
                <Typography variant="body1" fontWeight={600}>
                    No investors found
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    Try adjusting search or add a new investor
                </Typography>
            </Box>
        ),

        renderRowActions: preview
            ? undefined
            : ({ row, table: tbl }) => (
                  <>
                      <IconButton onClick={() => tbl.setEditingRow(row)}>
                          <EditIcon sx={{ color: "var(--color-accent-primary)" }} />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(row.original._id)}>
                          <DeleteIcon sx={{ color: "#ef4444" }} />
                      </IconButton>
                  </>
              ),

        initialState: preview
            ? { density: "compact" }
            : {
                  sorting: [{ id: "createdAt", desc: true }],
                  showGlobalFilter: false,
                  columnVisibility: {
                      createdAt: true,
                  },
              },

        enablePagination: !preview,
        enableBottomToolbar: !preview,
    });

    const isSearching = loading || globalFilterInput.trim() !== debouncedSearch;

    const controlsPanel = !preview && (
        <div
            className="pro-controls-panel pro-animate-in"
            style={{ ["--pro-delay" as string]: "280ms" }}
        >
            <div className="pro-controls-panel__header">
                <div className="pro-controls-panel__title">
                    <Search size={16} className="pro-controls-panel__title-icon" aria-hidden />
                    <span>Quick Search</span>
                </div>
                <div className="pro-controls-panel__meta">
                    {isSearching ? (
                        <span className="pro-search-pulse">Searching…</span>
                    ) : debouncedSearch || genderFilter ? (
                        <span className="pro-search-meta">
                            {total.toLocaleString()} match{total === 1 ? "" : "es"}
                        </span>
                    ) : (
                        <span className="pro-search-hint">Name · Code · Phone · Gender</span>
                    )}
                </div>
            </div>

            <div className="pro-search-field">
                <InputGroup inside className="pro-search-input">
                    <Input
                        placeholder="Search name, code, phone, gender…"
                        value={globalFilterInput}
                        onChange={(v) => setGlobalFilterInput(v)}
                    />
                    <InputGroup.Addon className="pro-search-addon">
                        {globalFilterInput ? (
                            <button
                                type="button"
                                className="pro-search-clear"
                                onClick={() => setGlobalFilterInput("")}
                                aria-label="Clear search"
                            >
                                <X size={15} />
                            </button>
                        ) : (
                            <Search size={16} />
                        )}
                    </InputGroup.Addon>
                </InputGroup>
            </div>

            {(debouncedSearch || genderFilter) && (
                <div className="pro-active-filters pro-slide-in">
                    {debouncedSearch && (
                        <Chip
                            label={`Search: ${debouncedSearch}`}
                            size="small"
                            onDelete={() => setGlobalFilterInput("")}
                            className="pro-filter-chip"
                            sx={{
                                fontWeight: 600,
                                backgroundColor: isDark ? "rgba(34,211,238,0.12)" : undefined,
                                border: isDark ? "1px solid rgba(34,211,238,0.25)" : undefined,
                            }}
                        />
                    )}
                    {genderFilter && (
                        <Chip
                            label={`Gender: ${genderFilter}`}
                            size="small"
                            onDelete={() => setGenderFilter("")}
                            className="pro-filter-chip"
                            sx={{ fontWeight: 600 }}
                        />
                    )}
                </div>
            )}

            <div className="pro-controls-divider" aria-hidden />

            <div className="pro-controls-panel__section-head">
                <SlidersHorizontal size={14} aria-hidden />
                <span>Filters & Actions</span>
            </div>

            <div className="pro-toolbar-row">
                <Button
                    variant="contained"
                    className="investors-add-btn pro-btn-lift"
                    startIcon={<AddIcon />}
                    onClick={() => table.setCreatingRow(true)}
                    sx={{
                        textTransform: "none",
                        borderRadius: "10px",
                        fontWeight: 700,
                        px: 2,
                    }}
                >
                    Add Investor
                </Button>

                <div className="pro-toolbar-group pro-toolbar-group--filters">
                    {(["", ...GENDER_OPTIONS] as const).map((g) => (
                        <Chip
                            key={g || "all"}
                            label={g || "All"}
                            clickable
                            className={`investors-filter-chip pro-filter-chip-btn${genderFilter === g ? " pro-filter-chip-btn--active" : ""}`}
                            onClick={() => {
                                setGenderFilter(g);
                                setPagination((p) => ({ ...p, pageIndex: 0 }));
                            }}
                            variant={genderFilter === g ? "filled" : "outlined"}
                            size="small"
                            sx={{
                                fontWeight: 600,
                                borderColor: "var(--color-border-strong)",
                                color:
                                    genderFilter === g
                                        ? isDark
                                            ? "#060816"
                                            : "#fff"
                                        : "var(--color-text-secondary)",
                                backgroundColor:
                                    genderFilter === g
                                        ? "var(--color-accent-primary)"
                                        : isDark
                                          ? "rgba(255,255,255,0.03)"
                                          : "transparent",
                            }}
                        />
                    ))}
                </div>

                <div className="pro-toolbar-group pro-toolbar-group--actions">
                    <Tooltip title="Investor Data Studio — import & schema">
                        <IconButton
                            className="pro-icon-btn"
                            onClick={() => navigate("/user-management/data-studio")}
                        >
                            <SlidersHorizontal size={18} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Export All">
                        <IconButton className="pro-icon-btn" onClick={() => exportToCSV(data)}>
                            <FileDownloadIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Export Selected">
                        <IconButton
                            className="pro-icon-btn"
                            onClick={() =>
                                exportToCSV(table.getSelectedRowModel().rows.map((r) => r.original))
                            }
                        >
                            <FileDownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Selected">
                        <span>
                            <IconButton
                                className="pro-icon-btn"
                                color="error"
                                disabled={table.getSelectedRowModel().rows.length === 0}
                                onClick={() =>
                                    handleBulkDelete(
                                        table.getSelectedRowModel().rows.map((r) => r.original)
                                    )
                                }
                            >
                                <DeleteSweepIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </div>
            </div>
        </div>
    );

    const tableContent = (
        <>
            {preview && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        margin: "50px 0px 10px 0px",
                    }}
                >
                    <Text size="lg" weight="bold">
                        Recent Registrations
                    </Text>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate("/user-management")}
                    >
                        View All
                    </Button>
                </div>
            )}

            <div
                className="registration-table-frame investors-table-frame pro-animate-in"
                style={{ ["--pro-delay" as string]: "420ms" }}
            >
                <MaterialReactTable table={table} />
            </div>
        </>
    );

    if (preview) {
        return <div className={isDark ? "investors-table-shell" : undefined}>{tableContent}</div>;
    }

    return (
        <AppPageLayout embedded showGlow={false}>
            <div
                className={`registration-page-shell investors-page-shell pro-page-stack${
                    isDark ? " registration-page-shell--dark" : ""
                }`}
            >
                <div className="pro-hero-row flex flex-col gap-5 lg:flex-row lg:justify-between lg:items-start">
                    <header className="pro-animate-in" style={{ ["--pro-delay" as string]: "0ms" }}>
                        <p className="registration-page-eyebrow investors-page-eyebrow pro-eyebrow-pulse">
                            Participant Database
                        </p>
                        <h1 className="registration-page-title investors-page-title">User Management</h1>
                        <p className="registration-page-subtitle investors-page-subtitle">
                            Manage participant profiles, search, filter by gender, and export data.
                        </p>
                    </header>

                    <div
                        className="pro-stat-grid registration-stat-grid grid grid-cols-2 gap-3 sm:gap-4 shrink-0 lg:w-[min(100%,24rem)]"
                    >
                        <StatChip label="Total" value={genderStats.totalInvestors} icon={Users} variant="total" delay={80} />
                        <StatChip label="Male" value={genderStats.maleCount} icon={UserRound} variant="male" delay={160} />
                        <StatChip label="Female" value={genderStats.femaleCount} icon={UserCircle2} variant="female" delay={240} />
                        <StatChip label="Other" value={genderStats.otherCount} icon={Sparkles} variant="other" delay={320} />
                    </div>
                </div>

                {controlsPanel}

                {tableContent}
            </div>
        </AppPageLayout>
    );
}
