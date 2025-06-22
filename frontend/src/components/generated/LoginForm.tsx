import React from 'react';

// Figma-generated assets (these would be served from the MCP server in actual usage)
const imgGroup = "data:image/svg+xml,%3Csvg viewBox='0 0 125 70' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='0' y='40' font-family='Poppins' font-weight='700' font-size='48' fill='%23004DFF'%3EMY%3C/text%3E%3C/svg%3E";
const imgGroup1 = "data:image/svg+xml,%3Csvg viewBox='0 0 69 27' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='0' y='20' font-family='Poppins' font-weight='400' font-size='18' fill='%23333'%3EVAT%3C/text%3E%3C/svg%3E";
const imgSolarUserBold = "data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' fill='%2340578C'/%3E%3C/svg%3E";
const imgGridiconsLock = "data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z' fill='%2340578C'/%3E%3C/svg%3E";
const imgGroup1097 = "data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z' fill='%2340578C'/%3E%3C/svg%3E";

export default function LoginFormGenerated() {
  return (
    <div
      className="bg-[#f3faff] relative size-full min-h-screen flex items-center justify-center"
      data-name="Login"
      id="node-1_6"
    >
      <div
        className="bg-white h-[732px] overflow-clip rounded-3xl shadow-[67.7561px_57.5927px_94.2939px_0px_rgba(228,236,254,0.85)] w-[759px] relative"
        id="node-1_7"
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          id="node-1_8"
        >
          {/* Logo Section */}
          <div
            className="h-[70px] overflow-clip w-[196.491px] mb-8"
            data-name="Frame"
            id="node-1_9"
          >
            <div className="relative w-full h-full flex items-center">
              <div className="flex items-baseline gap-1">
                <img
                  alt="MY"
                  className="block max-w-none h-12"
                  src={imgGroup}
                />
                <img
                  alt="VAT"
                  className="block max-w-none h-6"
                  src={imgGroup1}
                />
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div className="mb-12">
            <p className="font-['Poppins'] font-medium text-[24px] leading-[1.248] text-[#001441] text-center">
              <span>All your claims. </span>
              <span className="text-[#004dff]">One place.</span>
            </p>
          </div>

          {/* Form Section */}
          <div className="w-[472px]">
            <div className="flex flex-col gap-2.5 w-full">
              <div className="w-full">
                <div className="flex flex-col gap-4 w-full">
                  {/* Username Field */}
                  <div className="h-[60px] relative rounded-[100px] w-full">
                    <div className="h-[60px] overflow-clip relative w-full border border-[#bebebe] rounded-[100px]">
                      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex items-center gap-4">
                        <div className="w-5 h-5">
                          <img
                            alt="User icon"
                            className="block max-w-none size-full"
                            src={imgSolarUserBold}
                          />
                        </div>
                        <div className="font-['Poppins'] text-[14px] text-[#40578c]">
                          Username
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="h-[60px] relative rounded-[100px] w-full">
                    <div className="h-[60px] overflow-clip relative w-full border border-[#bebebe] rounded-[100px]">
                      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex items-center gap-4">
                        <div className="w-5 h-5">
                          <img
                            alt="Lock icon"
                            className="block max-w-none size-full"
                            src={imgGridiconsLock}
                          />
                        </div>
                        <div className="font-['Poppins'] text-[14px] text-[#40578c]">
                          Password
                        </div>
                      </div>
                      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 w-5 h-5">
                        <img
                          alt="Eye icon"
                          className="block max-w-none size-full cursor-pointer"
                          src={imgGroup1097}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remember Me & Forget Password */}
              <div className="w-full">
                <div className="flex items-center justify-between px-7">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-sm border border-[#93a4cc] opacity-70"></div>
                    <div className="font-['Poppins'] text-[12px] text-[#40578c]">
                      Remember me
                    </div>
                  </div>
                  <div className="font-['Poppins'] text-[12px] text-[#40578c] cursor-pointer">
                    Forget Password
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="mt-8">
            <div className="bg-[#0131ff] h-[70px] rounded-[100px] w-[472px] flex items-center justify-center cursor-pointer hover:bg-[#0128e6] transition-colors">
              <div className="font-['Poppins'] font-semibold text-[20px] text-white">
                Sign In
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 