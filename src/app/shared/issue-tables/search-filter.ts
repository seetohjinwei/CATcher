import { Issue } from '../../core/models/issue.model';
import { IssueService } from '../../core/services/issue.service';
import { TABLE_COLUMNS } from './issue-tables-columns';

const DELIMITER = ';';

/**
 * This module serves to improve separation of concerns in IssuesDataTable.ts module by containing the logic for
 * applying search filter to the issues data table in this module.
 * This module exports a single function applySearchFilter which is called by IssuesDataTable.
 */
export function applySearchFilter(filter: string, displayedColumn: string[], issueService: IssueService, data: Issue[]): Issue[] {
  const filters: string[] = filter.split(DELIMITER).filter((filter) => filter !== '');
  const hasNonEmptyFilters: boolean = filters.length > 0;

  if (!hasNonEmptyFilters) {
    return data.slice();
  }

  const searchKeys: string[] = filters.map((filter) => filter.toLowerCase());

  const result = data.slice().filter((issue: Issue) => {
    for (const column of displayedColumn) {
      switch (column) {
        case TABLE_COLUMNS.ASSIGNEE:
          if (matchesAssignee(issue.assignees, searchKeys)) {
            return true;
          }
          break;
        case TABLE_COLUMNS.DUPLICATED_ISSUES:
          if (matchesDuplicatedIssue(issueService, issue.id, searchKeys)) {
            return true;
          }
          break;
        default:
          if (matchesOtherColumns(issue, column, searchKeys)) {
            return true;
          }
          break;
      }
    }
    return false;
  });
  return result;
}

function containsSearchKey(item: string, searchKeys: string[]): boolean {
  return searchKeys.some((searchKey) => item.indexOf(searchKey) !== -1);
}

function duplicatedIssuesContainsSearchKey(duplicatedIssues: Issue[], searchKeys: string[]): boolean {
  return duplicatedIssues.some((el) => searchKeys.some((searchKey) => `#${String(el.id)}`.includes(searchKey)));
}

function matchesAssignee(assignees: string[], searchKeys: string[]): boolean {
  return assignees.some((assignee) => containsSearchKey(assignee.toLowerCase(), searchKeys));
}

function matchesDuplicatedIssue(issueService: IssueService, id: number, searchKeys: string[]): boolean {
  const duplicatedIssues = issueService.issues$.getValue().filter((el) => el.duplicateOf === id);
  return duplicatedIssuesContainsSearchKey(duplicatedIssues, searchKeys);
}

function matchesOtherColumns(issue: Issue, column: string, searchKeys: string[]): boolean {
  const searchStr = String(issue[column]).toLowerCase();
  return containsSearchKey(searchStr, searchKeys);
}
