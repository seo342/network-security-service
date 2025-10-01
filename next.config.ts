import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint:{
    ignoreDuringBuilds:true,
  },
  api:{
    bodyParser:false,
  },
};
module.exports=nextConfig

export default nextConfig;
