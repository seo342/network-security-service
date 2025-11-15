import { NextResponse } from "next/server";
import fs from "fs"
import path from "path"
import { FilePen } from "lucide-react";

export async function GET(req:Request) {
    const {searchParams}=new URL(req.url)
    const type=searchParams.get("type") //exe or pdf

    if(!type){
        return NextResponse.json({error:"type 파라미터 필요"},{status:400})
    }

    //파일 경로 설정
    const fileName=
    type === "exe"?"AION Sentinel.exe" : type==="pdf" ? "manual.pdf" : null
    if (!fileName){
        return NextResponse.json({error:"잘못된 파일 타입"},{status:400})
    }

    const filePath=path.join(process.cwd(),"public","files",fileName)
    try{
        const fileBuffer=fs.readFileSync(filePath)

        return new NextResponse(fileBuffer,{
            headers:{
                "Content-Type":type==="exe" ? "application/octet-stream" : "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        })
    }
    catch(error){
        console.error("파일 다운로드 에러",error)
        return NextResponse.json({error:"파일을 찾을 수 없음"},{status:404})
    }
}