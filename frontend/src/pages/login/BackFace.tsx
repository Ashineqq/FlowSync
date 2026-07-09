import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const features = [
  { title: 'AI 任务拆解', desc: '智能分解项目目标为可执行任务' },
  { title: '进度追踪', desc: '实时可视化，掌控每个任务状态' },
  { title: '团队协作', desc: '负责人/成员双角色权限管理' },
  { title: '自动总结', desc: '周报月报一键生成，省时省力' },
];

export default function BackFace() {
  return (
    <Card
      className="w-[460px] h-full border-0 rounded-2xl bg-white/90 backdrop-blur-xl justify-center"
      style={{
        boxShadow:
          '0 0 0 1px oklch(0 0 0 / 0.04), 0 4px 16px oklch(0 0 0 / 0.06), 0 12px 48px oklch(0 0 0 / 0.08), 0 24px 64px oklch(0 0 0 / 0.06)',
      }}
    >
      <CardHeader className="pb-4 pt-8">
        <CardTitle className="text-2xl text-center font-light tracking-wider text-[oklch(0.2 0 0)]">
          FlowSync
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-6 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed">
          FlowSync 是一个轻量级的项目协同管理平台，专为中小团队打造。
        </p>

        <Separator className="my-5" />

        <div className="grid grid-cols-2 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg bg-[oklch(0.55_0.18_260/0.06)] p-3 text-left"
            >
              <Badge
                variant="secondary"
                className="mb-1.5 bg-[oklch(0.55_0.18_260/0.12)] text-[oklch(0.45_0.15_260)] hover:bg-[oklch(0.55_0.18_260/0.12)] text-[10px] px-1.5 py-0"
              >
                {f.title}
              </Badge>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <p className="text-xs text-muted-foreground/60">
          点击空白区域返回登录
        </p>
      </CardContent>
    </Card>
  );
}
