import { Outlet } from "react-router-dom";
import Header from "../components/organisms/Header.jsx";
import Footer from "../components/organisms/Footer.jsx";
import DemoNotice from "../components/DemoNotice.jsx";
import styles from "./AppLayout.module.css";

// Every route in the app is a child of this element, so the header, the demo
// notice and the footer are rendered once for all of them. 
// there is no URL that renders content without navigation around it.
//
// DemoNotice is mounted here rather than inside Header. It already knows
// how to disappear. it reads USING_MOCK_API from the api layer itself so
// this layout does not need to know the flag exists.
export default function AppLayout() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <DemoNotice />
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}