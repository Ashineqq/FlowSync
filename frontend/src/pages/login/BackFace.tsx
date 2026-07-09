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
      className="w-[460px] h-full border border-border/40 rounded-2xl bg-card/90 backdrop-blur-xl justify-center shadow-xl"
    >
      <CardHeader className="pb-4 pt-8">
        <CardTitle className="text-2xl text-center font-light tracking-wider text-card-foreground">
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
              className="rounded-lg bg-accent/50 p-3 text-left"
            >
              <Badge
                variant="secondary"
                className="mb-1.5 bg-accent text-accent-foreground hover:bg-accent text-[10px] px-1.5 py-0"
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
