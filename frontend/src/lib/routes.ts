export const getRoleHomePath = (role?: string | null) => {
  switch (role?.trim().toLowerCase()) {
    case "responder":
      return "/responder";
    case "dispatcher":
      return "/dashboard/incidents";
    case "supervisor":
      return "/dashboard/closures";
    case "operator":
    default:
      return "/dashboard";
  }
};

export const getRoleWorkspaceName = (role?: string | null) => {
  switch (role?.trim().toLowerCase()) {
    case "responder":
      return "responder workspace";
    case "dispatcher":
      return "dispatch workspace";
    case "supervisor":
      return "supervisor workspace";
    case "operator":
    default:
      return "Command Room";
  }
};
