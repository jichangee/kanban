# 自动化规则重复执行问题修复

## 问题描述

之前的自动化规则系统存在以下问题：
1. **重复执行规则**：每次任务更新时都会重新执行所有自动化规则
2. **重复添加链接**：相同的链接会被多次添加到任务中
3. **性能问题**：不必要的重复计算和数据库查询

## 修复方案

### 1. 创建统一的自动化规则执行函数

在 `lib/automation.ts` 中创建了：
- `executeAutomationRules()`: 执行自动化规则的核心函数
- `mergeAndDeduplicateLinks()`: 合并并去重链接列表
- 执行缓存机制：防止相同内容重复执行相同规则

### 2. 防重复执行机制

- **执行缓存**：使用内存缓存记录已执行的规则
- **缓存键**：基于用户ID和任务内容生成唯一缓存键
- **规则检查**：执行前检查规则是否已经执行过
- **自动清理**：防止内存泄漏的缓存清理机制

### 3. 链接去重逻辑

- **现有链接检查**：执行规则前检查任务是否已有相同链接
- **生成链接去重**：避免同一批次生成重复链接
- **最终合并去重**：使用 Set 确保最终链接列表无重复

### 4. 缓存管理

- **用户级缓存清理**：规则修改/删除时清理对应用户的缓存
- **全局缓存清理**：提供清理所有缓存的函数
- **内存保护**：限制缓存大小，防止内存泄漏

## 修复的文件

1. **`lib/automation.ts`** - 新增自动化规则执行工具
2. **`app/api/kanban/tasks/route.ts`** - 任务创建API优化
3. **`app/api/kanban/tasks/[taskId]/route.ts`** - 任务更新API优化
4. **`app/api/automations/route.ts`** - 创建规则时清理缓存
5. **`app/api/automations/[ruleId]/route.ts`** - 更新/删除规则时清理缓存

## 使用方式

### 基本用法

```typescript
import { executeAutomationRules, mergeAndDeduplicateLinks } from '@/lib/automation';

// 执行自动化规则
const generatedLinks = await executeAutomationRules(content, userId, existingLinks);

// 合并并去重链接
const finalLinks = mergeAndDeduplicateLinks(existingLinks, userLinks, generatedLinks);
```

### 缓存管理

```typescript
import { clearUserExecutionCache, clearAllExecutionCache } from '@/lib/automation';

// 清理特定用户的缓存
clearUserExecutionCache(userId);

// 清理所有缓存
clearAllExecutionCache();
```

## 测试

运行测试文件验证功能：

```bash
npm test lib/automation.test.ts
```

## 性能提升

- **减少重复计算**：相同内容不再重复执行规则
- **减少数据库查询**：避免不必要的重复查询
- **内存优化**：智能缓存管理，防止内存泄漏
- **用户体验**：避免重复链接，保持任务整洁

## 注意事项

1. **缓存是内存级别的**：服务器重启后缓存会清空
2. **规则修改后缓存自动清理**：确保修改的规则能正常执行
3. **缓存大小限制**：超过1000条记录时自动清理旧记录
4. **线程安全**：当前实现适用于单线程环境，多线程环境需要额外考虑
