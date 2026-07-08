import { useState, useEffect, useRef } from 'react';
import { useSyncExternalStore } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getProjects } from '@/api/project';
import { importTaskPlan } from '@/api/ai';
import { getState, subscribe, startStream, resetState, setSelectedItems } from '@/store/taskBreakdown';
import type { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import PriorityBadge from '@/components/common/PriorityBadge';
import { Wand2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskBreakdown() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [importing, setImporting] = useState(false);
  const [showThinking, setShowThinking] = useState(true);
  const streamRef = useRef<HTMLDivElement>(null);

  const stream = useSyncExternalStore(subscribe, getState);

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [stream.thinkingText, stream.contentText]);

  const loadProjects = async () => {
    try {
      const res: any = await getProjects();
      if (res.success) setProjects(res.data || []);
    } catch (err) {
      console.error('加载项目失败:', err);
    }
  };

  const handleGenerate = () => {
    if (!selectedProjectId || !goal) return;
    const project = projects.find((p) => p.id === parseInt(selectedProjectId));
    startStream(selectedProjectId, { projectName: project?.name || '', goal, description });
  };

  const handleImport = async () => {
    if (stream.selectedItems.length === 0) return;
    setImporting(true);
    try {
      const items = stream.selectedItems.map((i) => stream.planItems[i]);
      const res: any = await importTaskPlan({
        projectId: parseInt(stream.projectId),
        creatorId: user?.id || 0,
        items,
      });
      if (res.success) {
        toast.success('任务导入成功', { description: `已导入 ${stream.selectedItems.length} 个任务` });
        resetState();
      } else {
        toast.error('导入失败', { description: res.message });
      }
    } catch (err) {
      toast.error('导入失败', { description: '网络错误，请重试' });
    } finally {
      setImporting(false);
    }
  };

  const toggleItem = (index: number) => {
    const current = new Set(stream.selectedItems);
    if (current.has(index)) {
      current.delete(index);
    } else {
      current.add(index);
    }
    setSelectedItems(Array.from(current));
  };

  const toggleAll = () => {
    if (stream.selectedItems.length === stream.planItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(stream.planItems.map((_, i) => i));
    }
  };

  const projectItems = projects.map((p) => ({ label: p.name, value: p.id.toString() }));
  const isStreaming = stream.status === 'streaming';
  const hasResult = stream.planItems.length > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">AI 任务拆解</h2>

      <Card>
        <CardHeader>
          <CardTitle>任务拆解配置</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="breakdown-form" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
            <FieldGroup>
              <Field>
                <FieldLabel required>选择项目</FieldLabel>
                <Select items={projectItems} value={selectedProjectId} onValueChange={(v: string | null) => setSelectedProjectId(v || '')}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="请选择项目" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>项目</SelectLabel>
                      {projectItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel required>任务目标</FieldLabel>
                <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="请输入任务目标" />
              </Field>
              <Field>
                <FieldLabel>补充说明</FieldLabel>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="请输入补充说明（可选）" />
              </Field>
              <Button type="submit" disabled={!selectedProjectId || !goal || isStreaming}>
                <Wand2 className="h-4 w-4 mr-2" />
                {isStreaming ? 'AI 分析中...' : 'AI 拆解'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {(stream.thinkingText || stream.contentText) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>
                {stream.status === 'done' ? 'AI 分析完成'
                  : stream.contentText ? 'AI 生成结果中...'
                  : stream.thinkingText ? 'AI 思考中...' : ''}
              </CardTitle>
              {stream.thinkingText && (
                <Button variant="ghost" size="sm" onClick={() => setShowThinking(!showThinking)}>
                  {showThinking ? '收起思考' : '展开思考'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div ref={streamRef} className="max-h-80 overflow-auto space-y-3">
              {stream.thinkingText && showThinking && (
                <div className="border-l-2 border-muted-foreground/30 pl-3">
                  <p className="text-xs text-muted-foreground mb-1">思维链</p>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed opacity-70">{stream.thinkingText}</pre>
                </div>
              )}
              {stream.contentText && (
                <div>
                  {stream.thinkingText && showThinking && <hr className="my-2 border-border" />}
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">{stream.contentText}</pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {stream.summary && (
        <Card>
          <CardHeader>
            <CardTitle>AI 分析结果</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{stream.summary}</p>
          </CardContent>
        </Card>
      )}

      {hasResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>建议任务列表</CardTitle>
              <Button onClick={handleImport} disabled={stream.selectedItems.length === 0 || importing}>
                <Download className="h-4 w-4 mr-2" />
                {importing ? '导入中...' : `导入选中任务 (${stream.selectedItems.length})`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" checked={stream.selectedItems.length === stream.planItems.length} onChange={toggleAll} />
                  </TableHead>
                  <TableHead>任务标题</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>建议天数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stream.planItems.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <input type="checkbox" checked={stream.selectedItems.includes(index)} onChange={() => toggleItem(index)} />
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell><PriorityBadge priority={item.priority} /></TableCell>
                    <TableCell>{item.suggestedDays} 天</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
