import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useReducer, useRef } from "react";

/*---------Using reducer to manage the active or inactive menu----------*/
const initialState = {
  activeMenu: "",
  mobileMenuState: false,
  scrollY: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case "setActiveMenu":
      return { ...state, activeMenu: action.payload };
    case "toggleMobileMenu":
      return { ...state, mobileMenuState: action.payload };
    case "setScrollY":
      return { ...state, scrollY: action.payload };
    default:
      throw new Error();
  }
}

function Header() {
  const router = useRouter();
  const currentRoute = router.pathname;

  const [state, dispatch] = useReducer(reducer, initialState);
  const headerRef = useRef(null);

  const handleScroll = () => {
    const { scrollY } = window;
    dispatch({ type: "setScrollY", payload: scrollY });
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <div className="top-bar two">
        <div className="container-lg container-fluid ">
          <div className="row">
            <div className="col-lg-5 col-md-5 d-flex align-items-center justify-content-md-start justify-content-center">
              <div className="open-time">
                <p>
                  <span>Opening Hour:</span> 9.00 am to 10.00 pm
                </p>
              </div>
            </div>
            <div className="col-lg-7 col-md-7 d-flex justify-content-end">
              <div className="contact-info">
                <ul>
                  <li>
                    <a href="mailto:info@example.com">
                      <i className="bi bi-envelope" /> info@example.com
                    </a>
                  </li>
                  <li>
                    <a>
                      <i className="bi bi-geo-alt" />
                      Road-01, Block-B, West London City
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <header
        ref={headerRef}
        className={
          state.scrollY > 10
            ? "header-area style-2 sticky"
            : "header-area style-2"
        }
      >
        <div className="container d-flex justify-content-between align-items-center h-16 ml-1 sm:ml-4 md:ml-4 sm:h-20">
          <div className="header-logo px-4">
            <Link href="/" legacyBehavior>
              <a>
                <img
                  alt="image"
                  className="img-fluid  h-12 md:ml-4 w-48 sm:h-16 md:px-2"
                  src="assets/images/logo/Asset2.svg"
                />
              </a>
            </Link>
          </div>

          <div
            className={
              state.mobileMenuState ? "main-menu show-menu" : "main-menu"
            }
          >
            <div className="mobile-logo-area d-lg-none d-flex justify-content-between align-items-center w-10">
              <div className="mobile-logo-wrap">
                <Link href="/" legacyBehavior>
                  <a>
                    <img alt="image" src="assets/images/logo/new.svg" />
                  </a>
                </Link>
              </div>
              <div
                className="menu-close-btn"
                onClick={() =>
                  dispatch({ type: "toggleMobileMenu", payload: false })
                }
              >
                <i className="bi bi-x-lg text-white" />
              </div>
            </div>

            <ul className="menu-list">
              <li>
                <Link href="/catering-and-events" legacyBehavior>
                  <a
                    className={
                      currentRoute === "/catering-and-events" ? "active" : ""
                    }
                  >
                    Catering And Events
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/reservation" legacyBehavior>
                  <a
                    className={currentRoute === "/reservation" ? "active" : ""}
                  >
                    Reservation
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact" legacyBehavior>
                  <a className={currentRoute === "/contact" ? "active" : ""}>
                    Contact
                  </a>
                </Link>
              </li>

              <li className="h-full flex items-center">
  <Link href="/menu1" legacyBehavior>
    <a
      className={`bg-yellow-500 text-white px-4 py-2 rounded-full ${
        currentRoute === "/menu1" ? "active" : ""
      } flex items-center justify-center`}
      style={{ height: '100%' }}
    >
     Order Menu
    </a>
  </Link>
</li>
            </ul>
          </div>

          <div
            className="mobile-menu-toggle d-lg-none"
            onClick={() =>
              dispatch({
                type: "toggleMobileMenu",
                payload: !state.mobileMenuState,
              })
            }
          >
            <i className="bi bi-list" />
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
