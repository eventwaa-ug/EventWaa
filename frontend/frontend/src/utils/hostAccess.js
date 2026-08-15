export function canCreateEvent(user){

    return (
        user?.role === "host" &&
        user?.verifiedHost === true
    );

}