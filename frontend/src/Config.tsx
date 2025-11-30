import { FaUserCog } from "react-icons/fa";
import { GiArchiveRegister } from "react-icons/gi";
import { GrDocumentUser } from "react-icons/gr";
import { FaPeopleGroup } from "react-icons/fa6";
import { MdSettings } from "react-icons/md";
import AddUser from "./components/add_user/AddUser";
import Profile from "./components/profile/Profile";
import Roles from "./components/roles/Roles";
import UserFieldRequirements from "./components/userFieldRequirements/UserFieldRequirements";
import Permission from "./components/permissions/Permission";

export const roles = {
  su: "Super User",
  admin: "Admin",
} as const;

export type RoleKey = keyof typeof roles;

// Define Sections type
export const sections = {
  master: "Master",
  workspace: "Workspace",
} as const;

export type SectionKey = keyof typeof sections;

// Panel item type
export interface PanelItem {
  name: string;
  route: string;
  icon: React.ReactNode;
  section: typeof sections[keyof typeof sections];
  element: React.ReactNode;
  permissions: typeof roles[keyof typeof roles][];
}

// Panel items array
export const components: PanelItem[] = [
  {
    name: "Roles",
    route: "/roles",
    icon: <FaPeopleGroup/>,
    section: sections.master,
    element: <Roles/>,
    permissions: [roles.su, roles.admin]
  },
  {
    name: "Add User",
    route: "/add-user",
    icon: <GiArchiveRegister />,
    section: sections.master,
    element: <AddUser />,
    permissions: [roles.su, roles.admin],
  },
  {
    name: "Profile",
    route: "/",
    icon: <FaUserCog />,
    section: sections.workspace,
    element: <Profile />,
    permissions: [],
  },
  {
    name: "User Fields",
    route: "/user-fields",
    icon: <GrDocumentUser/>,
    section: sections.master,
    element: <UserFieldRequirements/>,
    permissions: [roles.su, roles.admin]
  },
  {
    name: "Permission",
    route: "/permission",
    icon: <MdSettings />,
    section: sections.master,
    element: <Permission/>,
    permissions: [roles.su, roles.admin],
  }
];
// this is configuration file