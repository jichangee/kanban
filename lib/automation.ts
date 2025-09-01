import { db } from './db';

export interface AutomationRule {
  id: string;
  name: string;
  regex: string;
  linkTemplate: string;
  userId: string;
}

// 用于缓存已执行的规则，避免重复执行
const executionCache = new Map<string, Set<string>>();

/**
 * 生成缓存键
 * @param userId 用户ID
 * @param content 任务内容
 * @returns 缓存键
 */
function generateCacheKey(userId: string, content: string): string {
  return `${userId}:${content}`;
}

/**
 * 检查规则是否已经执行过
 * @param userId 用户ID
 * @param content 任务内容
 * @param ruleId 规则ID
 * @returns 是否已执行
 */
function isRuleExecuted(userId: string, content: string, ruleId: string): boolean {
  const cacheKey = generateCacheKey(userId, content);
  const executedRules = executionCache.get(cacheKey);
  return executedRules ? executedRules.has(ruleId) : false;
}

/**
 * 标记规则为已执行
 * @param userId 用户ID
 * @param content 任务内容
 * @param ruleId 规则ID
 */
function markRuleAsExecuted(userId: string, content: string, ruleId: string): void {
  const cacheKey = generateCacheKey(userId, content);
  if (!executionCache.has(cacheKey)) {
    executionCache.set(cacheKey, new Set());
  }
  executionCache.get(cacheKey)!.add(ruleId);
  
  // 清理旧的缓存条目（防止内存泄漏）
  if (executionCache.size > 1000) {
    const firstKey = executionCache.keys().next().value;
    executionCache.delete(firstKey);
  }
}

/**
 * 执行自动化规则，避免重复添加链接和重复执行
 * @param content 任务内容
 * @param userId 用户ID
 * @param existingLinks 现有的链接列表（可选）
 * @returns 新生成的链接列表
 */
export async function executeAutomationRules(
  content: string,
  userId: string,
  existingLinks: string[] = []
): Promise<string[]> {
  try {
    // 获取用户的自动化规则
    const automationRulesResult = await db.query(
      'SELECT * FROM "automation_rules" WHERE "userId" = $1',
      [userId]
    );
    const automationRules: AutomationRule[] = automationRulesResult.rows;
    const generatedLinks: string[] = [];

    for (const rule of automationRules) {
      try {
        // 检查规则是否已经执行过
        if (isRuleExecuted(userId, content, rule.id)) {
          console.log(`Rule ${rule.id} already executed for content, skipping...`);
          continue;
        }

        const regex = new RegExp(rule.regex);
        const match = content.match(regex);
        
        if (match) {
          let link = rule.linkTemplate;
          match.forEach((m: string, idx: number) => {
            link = link.replace(new RegExp('\\$' + idx, 'g'), m);
          });
          
          // 只有当链接不存在时才添加
          if (!existingLinks.includes(link) && !generatedLinks.includes(link)) {
            generatedLinks.push(link);
            // 标记规则为已执行
            markRuleAsExecuted(userId, content, rule.id);
            console.log(`Rule ${rule.id} executed successfully, generated link: ${link}`);
          }
        }
      } catch (e) {
        console.error(`Invalid regex for rule ${rule.id}:`, e);
      }
    }

    return generatedLinks;
  } catch (error) {
    console.error('[EXECUTE_AUTOMATION_RULES_ERROR]', error);
    return [];
  }
}

/**
 * 合并并去重链接列表
 * @param existingLinks 现有链接
 * @param userSubmittedLinks 用户提交的链接
 * @param generatedLinks 自动生成的链接
 * @returns 去重后的链接列表
 */
export function mergeAndDeduplicateLinks(
  existingLinks: string[] = [],
  userSubmittedLinks: string[] = [],
  generatedLinks: string[] = []
): string[] {
  return Array.from(new Set([...existingLinks, ...userSubmittedLinks, ...generatedLinks]));
}

/**
 * 清理特定用户的执行缓存
 * @param userId 用户ID
 */
export function clearUserExecutionCache(userId: string): void {
  const keysToDelete: string[] = [];
  for (const key of executionCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => executionCache.delete(key));
}

/**
 * 清理所有执行缓存
 */
export function clearAllExecutionCache(): void {
  executionCache.clear();
}
