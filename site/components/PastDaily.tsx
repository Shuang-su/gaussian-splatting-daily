import Link from "next/link";
import type { Daily } from "../lib/types";
import { dailyUrl } from "../lib/catalog";
import SourceImage from "./SourceImage";
export function weekday(date:string){return ['周日','周一','周二','周三','周四','周五','周六'][new Date(`${date}T12:00:00+08:00`).getUTCDay()];}
export default function PastDaily({reports}:{reports:Daily[]}){
 if(!reports.length)return null;
 return <section className="past-daily" id="past-daily"><div className="past-daily-inner"><header><h2>往期日报</h2><Link href="/daily/">查看全部</Link></header><div>{reports.map(report=><Link className="past-daily-card" href={dailyUrl(report.date)} key={report.id}><div><time className="past-date" dateTime={report.date}><span>{weekday(report.date)}</span><strong>{report.date.slice(8)}</strong></time><h3>{report.headline}</h3></div>{report.image && <SourceImage image={report.image} sizes="(max-width: 767px) 84px, 160px" />}</Link>)}</div></div></section>;
}
