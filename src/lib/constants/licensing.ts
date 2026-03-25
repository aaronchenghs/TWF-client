export const AGPL_LICENSE_URL = "https://www.gnu.org/licenses/agpl-3.0.en.html";
export const CLIENT_SOURCE_URL = "https://github.com/aaronchenghs/-TWF-client";
export const SERVER_SOURCE_URL = "https://github.com/aaronchenghs/TWF-server";

export const LICENSING_RESOURCE_LINKS = [
  {
    label: "View the AGPL-3.0-or-later license",
    href: AGPL_LICENSE_URL,
    description: "Read the full GNU Affero General Public License text.",
  },
  {
    label: "Client source code",
    href: CLIENT_SOURCE_URL,
    description: "Frontend repository for this web app.",
  },
  {
    label: "Server source code",
    href: SERVER_SOURCE_URL,
    description: "Backend repository for the networked game service.",
  },
] as const;
