import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const TableGrid = ({
    columns,
    data,
    totalCount,
    pageSizeOptions,
    paginationMode,
    controlledPage,
    controlledPageSize,
    onPageChange,
    onPageSizeChange,
    onSearch,
    onFilter,
    renderNoData,
    className,
    maxHeight,
    maxWidth,
    rowKey = (row, i) => row.id ?? i,
}) => {
    const [internalPage, setInternalPage] = useState(1);
    const [internalPageSize, setInternalPageSize] = useState(pageSizeOptions?.[0] ?? 10);
    const [pageInput, setPageInput] = useState("");
    const [columnSearch, setColumnSearch] = useState({});
    const [columnFilter, setColumnFilter] = useState({});

    const page = controlledPage ?? internalPage;
    const pageSize = controlledPageSize ?? internalPageSize;

    useEffect(() => {
        if (paginationMode === "client") return;
        if (totalCount == null) return;
        const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
        if (page > maxPage) {
            changePage(maxPage);
        }
    }, [totalCount, pageSize]);

    const changePage = (p) => {
        if (p < 1) p = 1;
        if (totalCount != null) {
            const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
            if (p > maxPage) p = maxPage;
        }
        if (onPageChange) onPageChange(p);
        if (controlledPage == null) setInternalPage(p);
    };

    const changePageSize = (s) => {
        if (onPageSizeChange) onPageSizeChange(Number(s));
        if (controlledPageSize == null) setInternalPageSize(Number(s));
        if (controlledPage == null) setInternalPage(1);
        if (onPageChange) onPageChange(1);
    };

    const handlePageInputGo = () => {
        const p = parseInt(pageInput, 10);
        if (!Number.isFinite(p)) return;
        changePage(p);
        setPageInput("");
    };

    const handleSearchChange = (colKey, value) => {
        const next = { ...columnSearch, [colKey]: value };
        setColumnSearch(next);
        if (onSearch) onSearch({ key: colKey, value });
    };

    const handleFilterApply = (colKey, value) => {
        const next = { ...columnFilter, [colKey]: value };
        setColumnFilter(next);
        if (onFilter) onFilter({ key: colKey, value });
    };

    const processedRows = useMemo(() => {
        let rows = Array.isArray(data) ? data : [];

        if (paginationMode === "client") {
            Object.entries(columnSearch).forEach(([k, v]) => {
                if (v == null || String(v).trim() === "") return;
                rows = rows.filter((r) => {
                    const cell = r[k];
                    return String(cell ?? "")
                        .toLowerCase()
                        .includes(String(v).toLowerCase());
                });
            });
            Object.entries(columnFilter).forEach(([k, v]) => {
                if (v == null || v === "") return;
                rows = rows.filter((r) => r[k] === v);
            });
        }

        return rows;
    }, [data, columnSearch, columnFilter, paginationMode]);

    const totalRows =
        paginationMode === "client" ? processedRows.length : (totalCount ?? processedRows.length);
    const maxPage = Math.max(1, Math.ceil(totalRows / pageSize));

    const visibleRows = useMemo(() => {
        if (paginationMode === "server") return processedRows;
        const start = (page - 1) * pageSize;
        return processedRows.slice(start, start + pageSize);
    }, [processedRows, page, pageSize, paginationMode]);

    const tableWrapStyle = {
        height: "100%",
        width: "100%",
        maxHeight: maxHeight ?? "100%",
        maxWidth: maxWidth ?? "100%",
        overflow: "auto",
    };

    // Calculate left offsets for sticky columns
    const leftOffsets = [];
    let cumulativeLeft = 0;
    columns.forEach((col) => {
        if (col.stick) {
            leftOffsets.push(cumulativeLeft);
            cumulativeLeft += col.width ?? 100;
        } else {
            leftOffsets.push(null);
        }
    });

    return (
        <div className={`rtg ${className ?? ""}`}>
            <div className="rtg__container">
                <div className="rtg__table-wrap" style={tableWrapStyle} aria-label="data-table">
                    <table className="rtg__table">
                        <thead className="rtg__thead">
                            <tr className="rtg__tr rtg__tr--head">
                                {columns.map((col, idx) => {
                                    const stickyStyle = col.stick
                                        ? {
                                              position: "sticky",
                                              left: leftOffsets[idx],
                                              zIndex: 5,
                                              borderRight: "1px solid var(--rtg-border)",
                                          }
                                        : {};
                                    return (
                                        <th
                                            key={col.key}
                                            className={`rtg__th ${col.stick ? "rtg__th--sticky" : ""}`}
                                            style={{
                                                minWidth: col.width ? `${col.width}px` : "auto",
                                                maxWidth: col.maxWidth
                                                    ? `${col.maxWidth}px`
                                                    : "none",
                                                whiteSpace: col.maxWidth ? "normal" : "nowrap",
                                                overflowWrap: col.maxWidth
                                                    ? "break-word"
                                                    : "normal",
                                                textOverflow: col.maxWidth ? "clip" : "ellipsis",
                                                width: "fit-content",
                                                ...stickyStyle,
                                            }}
                                            data-key={col.key}
                                        >
                                            <div className="rtg__th-inner">
                                                <div className="rtg__title">{col.title}</div>
                                                {col.searchable && (
                                                    <input
                                                        type="search"
                                                        placeholder={`Search ${col.title}`}
                                                        value={columnSearch[col.key] ?? ""}
                                                        onChange={(e) =>
                                                            handleSearchChange(
                                                                col.key,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="rtg__search-input"
                                                    />
                                                )}
                                                {col.filterable && col.filterOptions && (
                                                    <select
                                                        value={columnFilter[col.key] ?? ""}
                                                        onChange={(e) =>
                                                            handleFilterApply(
                                                                col.key,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="rtg__filter-select"
                                                    >
                                                        <option value="">All</option>
                                                        {col.filterOptions.map((opt) => (
                                                            <option
                                                                key={opt.value}
                                                                value={opt.value}
                                                            >
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        <tbody className="rtg__tbody">
                            {visibleRows.length === 0 ? (
                                <tr className="rtg__tr">
                                    <td className="rtg__no-data" colSpan={columns.length}>
                                        {renderNoData ? renderNoData() : "No data to display"}
                                    </td>
                                </tr>
                            ) : (
                                visibleRows.map((row, rIdx) => (
                                    <tr
                                        key={rowKey(row, (page - 1) * pageSize + rIdx)}
                                        className={`rtg__tr ${rIdx % 2 === 0 ? "rtg__tr--even" : "rtg__tr--odd"}`}
                                    >
                                        {columns.map((col, idx) => {
                                            const stickyStyle = col.stick
                                                ? {
                                                      position: "sticky",
                                                      left: leftOffsets[idx],
                                                      zIndex: 3,
                                                      background: "var(--rtg-row-even)",
                                                      borderRight: "1px solid var(--rtg-border)",
                                                  }
                                                : {};
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`rtg__td ${col.stick ? "rtg__td--sticky" : ""}`}
                                                    style={{
                                                        minWidth: col.width
                                                            ? `${col.width}px`
                                                            : "auto",
                                                        maxWidth: col.maxWidth
                                                            ? `${col.maxWidth}px`
                                                            : "none",
                                                        whiteSpace: col.maxWidth
                                                            ? "normal"
                                                            : "nowrap",
                                                        overflowWrap: col.maxWidth
                                                            ? "break-word"
                                                            : "normal",
                                                        textOverflow: col.maxWidth
                                                            ? "clip"
                                                            : "ellipsis",
                                                        width: "fit-content",
                                                        ...stickyStyle,
                                                    }}
                                                >
                                                    {col.render
                                                        ? col.render(row[col.key], row)
                                                        : (row[col.key] ?? "")}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="rtg__pager">
                    <div className="rtg__pager-left">
                        <div className="rtg__pager-info">
                            Showing{" "}
                            <strong>{Math.min((page - 1) * pageSize + 1, totalRows)}</strong> -{" "}
                            <strong>{Math.min(page * pageSize, totalRows)}</strong> of{" "}
                            <strong>{totalRows}</strong>
                        </div>
                    </div>

                    <div className="rtg__pager-center">
                        <button
                            className="rtg__btn"
                            onClick={() => changePage(1)}
                            disabled={page <= 1}
                            aria-label="first page"
                        >
                            ⏮
                        </button>
                        <button
                            className="rtg__btn"
                            onClick={() => changePage(page - 1)}
                            disabled={page <= 1}
                            aria-label="prev page"
                        >
                            ◀
                        </button>
                        <span className="rtg__page-indicator">Page</span>
                        <span className="rtg__current-page" aria-live="polite">
                            {page}
                        </span>
                        <span className="rtg__of">of</span>
                        <span className="rtg__max-page">{maxPage}</span>
                        <button
                            className="rtg__btn"
                            onClick={() => changePage(page + 1)}
                            disabled={page >= maxPage}
                            aria-label="next page"
                        >
                            ▶
                        </button>
                        <button
                            className="rtg__btn"
                            onClick={() => changePage(maxPage)}
                            disabled={page >= maxPage}
                            aria-label="last page"
                        >
                            ⏭
                        </button>
                    </div>

                    <div className="rtg__pager-right">
                        <label className="rtg__pagesize-label">Rows</label>
                        <select
                            className="rtg__select"
                            value={pageSize}
                            onChange={(e) => changePageSize(e.target.value)}
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>

                        <div className="rtg__go-to">
                            <input
                                type="text"
                                className="rtg__go-input"
                                placeholder="Go to page"
                                value={pageInput}
                                onChange={(e) => setPageInput(e.target.value)}
                            />
                            <button className="rtg__go-btn" onClick={handlePageInputGo}>
                                Go
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

TableGrid.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            title: PropTypes.node,
            width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            render: PropTypes.func,
            searchable: PropTypes.bool,
            filterable: PropTypes.bool,
            filterOptions: PropTypes.array,
            stick: PropTypes.bool,
        })
    ).isRequired,
    data: PropTypes.array,
    totalCount: PropTypes.number,
    pageSizeOptions: PropTypes.array,
    paginationMode: PropTypes.oneOf(["client", "server"]),
    controlledPage: PropTypes.number,
    controlledPageSize: PropTypes.number,
    onPageChange: PropTypes.func,
    onPageSizeChange: PropTypes.func,
    onSearch: PropTypes.func,
    onFilter: PropTypes.func,
    renderNoData: PropTypes.func,
    className: PropTypes.string,
    maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rowKey: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
};

TableGrid.defaultProps = {
    data: [],
    totalCount: undefined,
    pageSizeOptions: [10, 25, 50, 100],
    paginationMode: "client",
    controlledPage: undefined,
    controlledPageSize: undefined,
    onPageChange: undefined,
    onPageSizeChange: undefined,
    onSearch: undefined,
    onFilter: undefined,
    renderNoData: undefined,
    className: "",
};

export default TableGrid;
