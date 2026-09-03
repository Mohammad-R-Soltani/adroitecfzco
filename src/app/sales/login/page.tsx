import { redirect } from "next/navigation";

/**
 * Both modules now sign in from one page. This route stays so existing links
 * — and the redirect salesDal issues when access is missing — still land
 * somewhere sensible.
 */
export default function SalesLoginRedirect() {
  redirect("/login");
}
