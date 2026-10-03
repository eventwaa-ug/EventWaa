import { useEffect, useState } from "react";
import {
    Users,
    Search,
    X,
    ShieldCheck,
    Mail,
    UserCog,
    CircleCheck,
    CircleAlert,
    Save,
    Ban,
    UserCheck,
    SlidersHorizontal,
} from "lucide-react";
import "./AdminUsers.css";
import { adminFetch } from "../utils/adminAPI";

/* =========================================================
   ADMIN USERS
========================================================= */

function AdminUsers() {

    const [users, setUsers] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [roleFilter, setRoleFilter] =
        useState("all");

    const [statusFilter, setStatusFilter] =
        useState("all");

    /* =========================================================
       LOAD USERS
    ========================================================= */

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {

        try {

            const data =
                await adminFetch(
                    "/admin/users"
                );

            setUsers(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.users)
                        ? data.users
                        : []
            );

        } catch (error) {

            console.error(
                "ADMIN USERS LOAD ERROR:",
                error
            );

            setUsers([]);

        }

    };

    /* =========================================================
       UPDATE USER
    ========================================================= */

    const updateUser = async (user) => {

        try {

            await adminFetch(
                `/admin/users/${user.id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        role: user.role,
                        status: user.status,
                    }),
                }
            );

            alert(
                "User updated successfully"
            );

            loadUsers();

        } catch (error) {

            console.error(
                "ADMIN USER UPDATE ERROR:",
                error
            );

            alert(
                error.message ||
                "Failed to update user."
            );

        }

    };

    /* =========================================================
       CHANGE ROLE
    ========================================================= */

    const changeRole = (
        id,
        role
    ) => {

        setUsers(prev =>
            prev.map(user =>
                user.id === id
                    ? {
                        ...user,
                        role,
                    }
                    : user
            )
        );

    };

    /* =========================================================
       TOGGLE STATUS
    ========================================================= */

    const toggleStatus = (
        id
    ) => {

        setUsers(prev =>
            prev.map(user =>
                user.id === id
                    ? {
                        ...user,
                        status:
                            user.status ===
                            "suspended"
                                ? "active"
                                : "suspended",
                    }
                    : user
            )
        );

    };

    /* =========================================================
       FILTER USERS
    ========================================================= */

    const filteredUsers =
        users.filter(user => {

            const searchValue =
                search.trim().toLowerCase();

            const name =
                String(
                    user?.name || ""
                ).toLowerCase();

            const email =
                String(
                    user?.email || ""
                ).toLowerCase();

            const role =
                String(
                    user?.role || "user"
                ).toLowerCase();

            const status =
                String(
                    user?.status || "active"
                ).toLowerCase();

            const matchesSearch =
                !searchValue ||
                name.includes(searchValue) ||
                email.includes(searchValue);

            const matchesRole =
                roleFilter === "all" ||
                role === roleFilter;

            const matchesStatus =
                statusFilter === "all" ||
                status === statusFilter;

            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus
            );

        });

    /* =========================================================
       RESET FILTERS
    ========================================================= */

    const resetFilters = () => {

        setSearch("");
        setRoleFilter("all");
        setStatusFilter("all");

    };

    const hasFilters =
        search.trim() !== "" ||
        roleFilter !== "all" ||
        statusFilter !== "all";

    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <div className="admin-users">

            {/* =================================================
               PAGE HEADER
            ================================================= */}

            <div className="admin-users-header">

                <div className="admin-users-title">

                    <div className="admin-users-title-icon">
                        <Users
                            aria-hidden="true"
                        />
                    </div>

                    <div>

                        <span className="admin-users-eyebrow">
                            EVENTWAA ADMIN
                        </span>

                        <h1>
                            Users Management
                        </h1>

                        <p>
                            Manage user accounts,
                            roles, verification and
                            account status.
                        </p>

                    </div>

                </div>


                <div className="admin-users-count">

                    <Users
                        aria-hidden="true"
                    />

                    <div>
                        <strong>
                            {users.length}
                        </strong>

                        <span>
                            Total Users
                        </span>
                    </div>

                </div>

            </div>


            {/* =================================================
               SEARCH + FILTER TOOLBAR
            ================================================= */}

            <div className="admin-users-toolbar">

                {/* SEARCH */}

                <div className="user-search-wrapper">

                    <Search
                        aria-hidden="true"
                    />

                    <input
                        className="user-search"
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        aria-label="Search users"
                    />

                    {search && (

                        <button
                            type="button"
                            className="clear-user-search"
                            onClick={() =>
                                setSearch("")
                            }
                            aria-label="Clear search"
                        >
                            <X
                                aria-hidden="true"
                            />
                        </button>

                    )}

                </div>


                {/* FILTERS */}

                <div className="admin-users-filters">

                    <div className="filter-label">

                        <SlidersHorizontal
                            aria-hidden="true"
                        />

                        <span>
                            Filters
                        </span>

                    </div>


                    <select
                        value={roleFilter}
                        onChange={(e) =>
                            setRoleFilter(
                                e.target.value
                            )
                        }
                        className="admin-users-filter"
                        aria-label="Filter users by role"
                    >

                        <option value="all">
                            All Roles
                        </option>

                        <option value="user">
                            Users
                        </option>

                        <option value="host">
                            Hosts
                        </option>

                        <option value="admin">
                            Admins
                        </option>

                    </select>


                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                        className="admin-users-filter"
                        aria-label="Filter users by status"
                    >

                        <option value="all">
                            All Status
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="suspended">
                            Suspended
                        </option>

                    </select>


                    {hasFilters && (

                        <button
                            type="button"
                            className="reset-filters"
                            onClick={
                                resetFilters
                            }
                        >
                            <X
                                aria-hidden="true"
                            />

                            Reset

                        </button>

                    )}

                </div>

            </div>


            {/* =================================================
               RESULTS BAR
            ================================================= */}

            <div className="admin-users-results">

                <span>

                    Showing{" "}

                    <strong>
                        {filteredUsers.length}
                    </strong>

                    {" "}of{" "}

                    <strong>
                        {users.length}
                    </strong>

                    {" "}users

                </span>

                {hasFilters && (

                    <span className="filters-active">
                        Filters active
                    </span>

                )}

            </div>


            {/* =================================================
               USERS GRID
            ================================================= */}

            {filteredUsers.length === 0 ? (

                <div className="admin-users-empty">

                    <div className="empty-icon">

                        <Search
                            aria-hidden="true"
                        />

                    </div>

                    <h2>
                        No Users Found
                    </h2>

                    <p>
                        No users match your
                        current search or filters.
                    </p>

                    {hasFilters && (

                        <button
                            type="button"
                            className="empty-reset"
                            onClick={
                                resetFilters
                            }
                        >
                            Show All Users
                        </button>

                    )}

                </div>

            ) : (

                <div className="users-grid">

                    {filteredUsers.map(
                        user => {

                            const isSuspended =
                                user?.status ===
                                "suspended";

                            const role =
                                user?.role ||
                                "user";

                            return (

                                <article
                                    className="user-card"
                                    key={user.id}
                                >

                                    {/* =========================
                                       USER HEADER
                                    ========================= */}

                                    <div className="user-card-header">

                                        <div className="user-avatar">

                                            {
                                                user?.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() ||
                                                "U"
                                            }

                                        </div>


                                        <div className="user-card-identity">

                                            <h2>
                                                {
                                                    user?.name ||
                                                    "Unnamed User"
                                                }
                                            </h2>

                                            <p>

                                                <Mail
                                                    aria-hidden="true"
                                                />

                                                {
                                                    user?.email ||
                                                    "No email"
                                                }

                                            </p>

                                        </div>

                                    </div>


                                    {/* =========================
                                       ROLE BADGE
                                    ========================= */}

                                    <div className="user-role-badge">

                                        <UserCog
                                            aria-hidden="true"
                                        />

                                        <span>
                                            {role}
                                        </span>

                                    </div>


                                    {/* =========================
                                       ROLE CONTROL
                                    ========================= */}

                                    <div className="user-field">

                                        <div className="user-field-label">

                                            <UserCog
                                                aria-hidden="true"
                                            />

                                            <span>
                                                Role
                                            </span>

                                        </div>


                                        <select
                                            value={
                                                role
                                            }
                                            onChange={(e) =>
                                                changeRole(
                                                    user.id,
                                                    e.target.value
                                                )
                                            }
                                            aria-label={`Role for ${user?.name || "user"}`}
                                        >

                                            <option value="user">
                                                User
                                            </option>

                                            <option value="host">
                                                Host
                                            </option>

                                            <option value="admin">
                                                Admin
                                            </option>

                                        </select>

                                    </div>


                                    {/* =========================
                                       VERIFIED HOST
                                    ========================= */}

                                    {user?.verifiedHost && (

                                        <div className="verified-user">

                                            <ShieldCheck
                                                aria-hidden="true"
                                            />

                                            <span>
                                                Verified Host
                                            </span>

                                        </div>

                                    )}


                                    {/* =========================
                                       STATUS
                                    ========================= */}

                                    <div className="user-status-row">

                                        <div className="user-field-label">

                                            {isSuspended ? (

                                                <CircleAlert
                                                    aria-hidden="true"
                                                />

                                            ) : (

                                                <CircleCheck
                                                    aria-hidden="true"
                                                />

                                            )}

                                            <span>
                                                Status
                                            </span>

                                        </div>


                                        <span
                                            className={
                                                isSuspended
                                                    ? "status suspended"
                                                    : "status active"
                                            }
                                        >

                                            {isSuspended
                                                ? "Suspended"
                                                : "Active"}

                                        </span>

                                    </div>


                                    {/* =========================
                                       ACTIONS
                                    ========================= */}

                                    <div className="user-actions">

                                        <button
                                            type="button"
                                            className="save-user"
                                            onClick={() =>
                                                updateUser(
                                                    user
                                                )
                                            }
                                        >

                                            <Save
                                                aria-hidden="true"
                                            />

                                            <span>
                                                Save Changes
                                            </span>

                                        </button>


                                        <button
                                            type="button"
                                            className="suspend-user"
                                            onClick={() =>
                                                toggleStatus(
                                                    user.id
                                                )
                                            }
                                        >

                                            {isSuspended ? (

                                                <UserCheck
                                                    aria-hidden="true"
                                                />

                                            ) : (

                                                <Ban
                                                    aria-hidden="true"
                                                />

                                            )}

                                            <span>
                                                {isSuspended
                                                    ? "Activate"
                                                    : "Suspend"}
                                            </span>

                                        </button>

                                    </div>

                                </article>

                            );

                        }
                    )}

                </div>

            )}

        </div>

    );

}

export default AdminUsers;