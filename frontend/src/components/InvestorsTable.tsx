import { useEffect, useMemo, useState } from "react";
import {
    MaterialReactTable,
    useMaterialReactTable,
} from "material-react-table";
import {
    IconButton,
    Button,
    Tooltip,
    Box,
    Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddIcon from "@mui/icons-material/Add";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../redux/store";
import {
    createInvestorData,
    deleteInvestorData,
    fetchInvestorData,
    updateInvestorData,
} from "../redux/store/slices/ExtraSlice/InvestorExtraSlice";
import { useNavigate } from "react-router-dom";
import { Text } from "rsuite";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

// ✅ CSV Export
const exportToCSV = (rows: any[]) => {
    const headers = ["Code", "Name", "Phone"];
    const csv = [
        headers.join(","),
        ...rows.map((row) =>
            [row.Code_No, row.Name, row.Phone_No].join(",")
        ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "investors.csv";
    a.click();
};

export default function InvestorsTable({ preview }: { preview?: boolean }) {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<any>([]);
    const [rowSelection, setRowSelection] = useState({});

    const investorState = useSelector((state: any) => state.Investors);
    const data = investorState?.data || [];
    const total = investorState?.total || 0;
    const loading = investorState?.loading;

    useEffect(() => {
        dispatch(
            fetchInvestorData({
                page: pagination.pageIndex + 1,
                limit: preview ? 10 : pagination.pageSize,
                search: globalFilter,
                sortBy: sorting[0]?.id || "createdAt",
                sortOrder: sorting.length
                    ? (sorting[0]?.desc ? "desc" : "asc")
                    : "desc",
            })
        );
    }, [dispatch, pagination, globalFilter, sorting, preview]);

    const previewData = preview ? data.slice(0, 10) : data;

    const columns = useMemo(
        () => [
            {
                accessorKey: "No",
                header: "No",
                size: 60,
            },
            {
                accessorKey: "Code_No",
                header: "Code",
                muiEditTextFieldProps: {
                    required: true,
                    type: "text",
                },
                Cell: ({ cell, row }: any) => {
                    const isNew =
                        new Date(row.original.createdAt).getTime() >
                        Date.now() - 1000 * 60 * 60 * 24;

                    return (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {cell.getValue()}
                            {isNew && (
                                <span
                                    style={{
                                        background: "#22c55e",
                                        color: "#fff",
                                        fontSize: "10px",
                                        padding: "2px 8px",
                                        borderRadius: "999px",
                                        fontWeight: "600",
                                    }}
                                >
                                    NEW
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "Name",
                header: "Name",
                muiEditTextFieldProps: {
                    required: true,
                },
            },
            {
                accessorKey: "Phone_No",
                header: "Phone",
                muiEditTextFieldProps: {
                    required: true,
                    type: "number",
                },
            },
        ],
        []
    );

    const table = useMaterialReactTable({
        columns,
        data: previewData,

        muiTablePaperProps: {
            elevation: 0,
            sx: {
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
            },
        },

        muiTableHeadCellProps: {
            sx: {
                backgroundColor: "#f9fafb",
                fontWeight: 600,
                fontSize: "13px",
                color: "#374151",
            },
        },

        muiTableBodyCellProps: {
            sx: {
                fontSize: "13px",
                color: "#374151",
            },
        },

        muiTableBodyRowProps: {
            sx: {
                '&:hover': {
                    backgroundColor: '#f9fafb',
                },
            },
        },

        muiTopToolbarProps: {
            sx: {
                backgroundColor: "#ffffff",
                borderBottom: "1px solid #e5e7eb",
                px: 2,
                py: 1,
            },
        },

        muiBottomToolbarProps: {
            sx: {
                borderTop: "1px solid #e5e7eb",
            },
        },

        enableEditing: preview ? false : true,
        createDisplayMode: "modal",
        positionActionsColumn: "last",

        onEditingRowSave: async ({ values, row, table }) => {
            if (!values.Code_No || !values.Name || !values.Phone_No) {
                toast.error("All fields required");
                return;
            }

            try {
                await dispatch(
                    updateInvestorData({
                        id: row.original._id,
                        data: values,
                    })
                ).unwrap();

                toast.success("Updated successfully");

                table.setEditingRow(null);

                dispatch(fetchInvestorData({
                    page: pagination.pageIndex + 1,
                    limit: pagination.pageSize,
                    search: globalFilter,
                    sortBy: sorting[0]?.id || "createdAt",
                    sortOrder: sorting.length
                        ? (sorting[0]?.desc ? "desc" : "asc")
                        : "desc",
                }));

            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Duplicate error");
            }
        },

        onCreatingRowSave: async ({ values, table }) => {
            if (!values.Code_No || !values.Name || !values.Phone_No) {
                toast.error("All fields required");
                return;
            }

            try {
                await dispatch(createInvestorData(values)).unwrap();

                toast.success("Investor Added");

                table.setCreatingRow(null);

                dispatch(fetchInvestorData({
                    page: pagination.pageIndex + 1,
                    limit: pagination.pageSize,
                    search: globalFilter,
                    sortBy: sorting[0]?.id || "createdAt",
                    sortOrder: sorting.length
                        ? (sorting[0]?.desc ? "desc" : "asc")
                        : "desc",
                }));

            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Duplicate or error");
            }
        },

        enableColumnFilters: preview ? false : true,
        enableGlobalFilter: preview ? false : true,
        enableRowSelection: preview ? false : true,
        onRowSelectionChange: setRowSelection,

        manualPagination: preview ? false : true,
        manualSorting: preview ? false : true,
        manualFiltering: preview ? false : true,

        rowCount: preview ? previewData.length : total,

        state: {
            pagination,
            globalFilter,
            sorting,
            rowSelection,
            isLoading: loading,
            showProgressBars: loading,
        },

        onPaginationChange: preview ? undefined : setPagination,
        onGlobalFilterChange: preview ? undefined : setGlobalFilter,
        onSortingChange: preview ? undefined : setSorting,

        renderTopToolbarCustomActions: ({ table }) =>
            !preview && (
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Tooltip title="Add">
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => table.setCreatingRow(true)}
                            sx={{
                                textTransform: "none",
                                borderRadius: "8px",
                                fontWeight: 600,
                            }}
                        >
                            Add Investor
                        </Button>
                    </Tooltip>

                    <Tooltip title="Export All">
                        <IconButton onClick={() => exportToCSV(data)}>
                            <FileDownloadIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Export Selected">
                        <IconButton
                            onClick={() =>
                                exportToCSV(
                                    table
                                        .getSelectedRowModel()
                                        .rows.map((r) => r.original)
                                )
                            }
                        >
                            <FileDownloadIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),

        renderRowActions: preview
            ? undefined
            : ({ row, table }) => (
                <>
                    <IconButton onClick={() => table.setEditingRow(row)}>
                        <EditIcon sx={{ color: "#3b82f6" }} />
                    </IconButton>

                    <IconButton
                        onClick={async () => {
                            const result = await Swal.fire({
                                title: "Delete?",
                                text: "This cannot be undone",
                                icon: "warning",
                                showCancelButton: true,
                            });

                            if (result.isConfirmed) {
                                try {
                                    await dispatch(deleteInvestorData(row.original._id)).unwrap();

                                    toast.success("Deleted");

                                    dispatch(fetchInvestorData({
                                        page: pagination.pageIndex + 1,
                                        limit: pagination.pageSize,
                                        search: globalFilter,
                                        sortBy: sorting[0]?.id || "createdAt",
                                        sortOrder: sorting.length
                                            ? (sorting[0]?.desc ? "desc" : "asc")
                                            : "desc",
                                    }));
                                } catch {
                                    toast.error("Delete failed");
                                }
                            }
                        }}
                    >
                        <DeleteIcon sx={{ color: "#ef4444" }} />
                    </IconButton>
                </>
            ),

        initialState: preview
            ? { density: "compact" }
            : {
                sorting: [{ id: "createdAt", desc: true }],
            },

        enablePagination: preview ? false : true,
        enableBottomToolbar: preview ? false : true,
    });

    return (
        <div>
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
                        onClick={() => navigate("/investors-list")}
                    >
                        View All
                    </Button>
                </div>
            )}

            <MaterialReactTable table={table} />
        </div>
    );
}