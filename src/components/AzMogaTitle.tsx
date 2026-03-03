import React from "react";

export default function AzMogaTitle() {
    return (
        <span className="font-black uppercase text-[26px] mx-auto text-transparent bg-clip-text animate-[logo_10s_linear_infinite]"
            style={{
                backgroundImage: "url(https://cdn.az-moga.bg/assets/all/logo-bg.jpg)",
                backgroundSize: "50%",
                WebkitBackgroundClip: "text",
            }}>
            „Аз мога — тук и сега”
        </span>
    );
}
