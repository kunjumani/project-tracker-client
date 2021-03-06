/**
 * Created by aravind on 3/9/16.
 */
import { Component, OnInit } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { Router} from '@angular/router';
import { StoryService} from '../../services/story.service';
import { StorageService} from '../../services/storage.service';
import { StoryDetails } from '../../models/StoryDetails';
import { Story } from '../../models/Story';
import {ActivatedRoute} from "@angular/router";
import { MemberList } from '../../models/MemberList';
import {ProjectMemberService} from "../../services/project.member.service";
import { FileExport } from '../../services/file.export';

@Component({
    selector: 'pt-tasks-home',
    template: require('./tasks-home.html'),
    encapsulation: ViewEncapsulation.None,
    styles: [
        require('./tasks-home.css').toString()
    ],
    providers: [StoryService, StorageService, ProjectMemberService, FileExport]
})

export class TasksHomeComponent implements OnInit{
    private storyRes:any;
    private errorMessage:any;
    private storyDetails:StoryDetails;
    private storyData: Story;
    private params:any;
    private project_id: number;
    private memberList: MemberList;
    private data: Story;
    private selectedStory: boolean;
    private selectedNav: string;
    private blockedTasks: Story;
    private storyStatus: any;
    private noStoryString: string;
    private storyComment: string;
    private storyCommentData:any;
    private commentsList: any;
    private storyLabelData: any;
    private storyLabelList: any;
    private clearLabelText: string;
    private storyID: string;
    private deleteMessage: string;
    private deleteStatus: boolean = false;
    private alertMessageClass: string;
    private taskCategory:string;
    private storyFocus: boolean;
    private storyDescription: string;
    constructor(private storyService: StoryService,
                private activatedRoute: ActivatedRoute,
                private memberService: ProjectMemberService,
                private router: Router,
                private fileExport: FileExport) {}
    ngOnInit() {
        this.storyDetails = {
            storySummery: '',
            storyType:'',
            storyPriority: 0,
            storyPoint: 0,
            storyAssignee: '',
            storyDescription: ''
        };
        this.data = {
            story_id: 0,
            story_summery: '',
            story_type:'',
            story_priority: 0,
            story_point: 0,
            createdAt:'',
            story_assignee: '',
            story_description: '',
            story_status: '0',
            user_detail: {},
            StoryList: {},
            storyStatus: 0
        };
        this.selectedStory = false;
        this.selectedNav = 'myTask';
        this.clearLabelText ='';
        this.storyComment ='';
        this.taskCategory = "Current";
        this.storyFocus = true;
        this.getURLParam();
        this.getMemberList();
        this.getAllStories();
    }

    onStoryDescriptionFocus() {
      this.storyFocus = false;
    }

    onStoryDescriptionBlur() {
      this.storyFocus = true;
    }

    getURLParam() {
        this.params = this.activatedRoute.params
            .subscribe(
                params => {
                    this.project_id = parseInt(params['id'], 10);
                }
            );
    }

    getMemberList() {
        this.memberService.getAllMember(this.project_id)
            .subscribe(
                memberDetails => {
                    this.memberList = memberDetails.member_list;
                    console.log(this.memberList);
                },
                error=> this.errorMessage =error
            )
    }

    getAllStories(){
        this.storyService.getAllStoryDetails(this.project_id)
            .subscribe(
                storyInfo => {
                    this.storyData = storyInfo.StoryList;
                    console.log('story_info----', storyInfo);
                    if(this.storyData && this.storyData.length) {
                        console.log('this.storyData----',this.storyData);
                        this.buildStoryDetailsView(this.storyData[0], 0);
                    } else {
                        this.noStoryString = "No stories are available";
                    }
                },
                error=> this.errorMessage = error
            )
    }

    private addStoryMessageClass: string;
    private addStoryMessage: string;
    addStoryData(storyInfo) {
        storyInfo.projectId = this.project_id;
        let StoryData = JSON.stringify(storyInfo);
        this.storyService.addStoryDetails(StoryData, this.project_id)
            .subscribe(
                addStoryRes => {
                    this.storyRes = addStoryRes;
                    this.addStoryMessageClass = this.storyRes.status ? 'alert-success': '';
                    this.addStoryMessage = "Task has been added successfully";
                    this.getURLParam();
                    this.getMemberList();
                    this.getAllStories();
                },
                error => this.errorMessage = error
            )
    }

    private updatedDescription: string;
    updateStoryDescription() {
        var data = {
          story_description: this.storyDescription,
          story_id: this.storyID
        };
        this.storyService.updateStoryDescription(JSON.stringify(data))
        .subscribe(
            updatedData =>{
                this.updatedDescription = updatedData;
                this.storyFocus = true;
            }
        )
    }
    cancelUpdateRequest() {
        this.storyFocus = true;
    }

    buildStoryDetailsView(data, selectedIndex) {
        this.selectedStory = selectedIndex;
        this.storyID = data.story_id;
        this.data = {
            story_id: data.story_id,
            story_summery: data.story_summery,
            story_type: data.story_type,
            story_priority: data.story_priority,
            story_status: data.story_status,
            story_point: data.story_point,
            createdAt: new Date(data.createdAt).toDateString(),
            story_assignee: data.story_assignee,
            story_description: data.story_description,
            user_detail: {
                firstName: data.user_detail.firstName
            },
            storyStatus: data.story_status ? data.story_status : 0
        };
        this.getCommentsByStory(data.story_id);
        this.getLabelByStory(data.story_id);
    }

    loadSelectedNav(selectedNav) {
        this.selectedNav = selectedNav;
        switch(this.selectedNav) {
            case 'myTask':
                this.getAllStories();
                break;
            case 'completedTask':
                this.getCompletedTasks();
                break;
            case 'currentTask':
                this.getCurrentTasks();
                break;
            case 'backLog':
                this.getBackLogTasks();
                break;
            case 'blockedTask':
                this.getBlockedTasks();
                break;
            case 'team':
                this.getTeamList();
                break;
            case 'settings':
                this.getProjectSettings();
                break;
        }
    }

    getCompletedTasks() {
        this.taskCategory = "Completed";
        this.storyService.getStoryByStatus(this.project_id, [4])
            .subscribe(
                completedTasks=> {
                    this.storyData = completedTasks.StoryList;
                    if(this.storyData && this.storyData.length) {
                        this.buildStoryDetailsView(this.storyData[0], 0);
                    } else {
                        this.noStoryString = "No stories are available";
                    }
                },
                error=> this.errorMessage =error
            )
    }

    getCurrentTasks() {
         this.taskCategory = "Current";
        this.storyService.getStoryByStatus(this.project_id, [2, 3])
            .subscribe(
                currentTasks=> {
                    this.storyData = currentTasks.StoryList;
                    if(this.storyData && this.storyData.length) {
                        this.buildStoryDetailsView(this.storyData[0], 0);
                    } else {
                        this.noStoryString = "No stories are available";
                    }
                },
                error=> this.errorMessage =error
            )
    }

    getStoryStatusByIndex(index) {
     var statusList=['', 'Unstarted', 'In Progress', 'Done', 'Delivered'];
     return statusList[index];
    }

    getBackLogTasks() {
        this.taskCategory = "Backlog";
        this.storyService.getStoryByStatus(this.project_id, [1])
            .subscribe(
                backLogTasks=> {
                    this.storyData = backLogTasks.StoryList;
                    if(this.storyData && this.storyData.length) {
                        this.buildStoryDetailsView(this.storyData[0], 0);
                    } else {
                        this.noStoryString = "No stories are available";
                    }
                },
                error=> this.errorMessage =error
            )
    }

    getBlockedTasks() {
        this.storyService.getStoryByStatus(this.project_id)
            .subscribe(
                blockedTasks=> {
                    this.blockedTasks = blockedTasks;
                    console.log('blockedTasks tasks--', this.blockedTasks)
                },
                error=> this.errorMessage =error
            )
    }

    getTeamList() {
        this.router.navigate(['/project-members', this.project_id]);
    }

    getProjectSettings() {
        this.router.navigate(['/project-settings', this.project_id]);
    }

    updateStoryStatus(status, storyId) {
        let storyStatusData = {
            story_status: status,
            story_id: storyId
        };
        this.storyService.updateStoryStatus(JSON.stringify(storyStatusData))
            .subscribe(
                storyStatus=> {
                    this.storyStatus = storyStatus;
                    if(this.storyStatus.status) {
                        this.data.storyStatus = status;
                    }
                },
                error => this.errorMessage = error
            )
    }

    addComment(comment, storyId) {
        var commentData = {
            story_id: storyId,
            story_comment: comment,
            user_id: 1
        };
        this.storyService.addStoryComment(JSON.stringify(commentData))
            .subscribe(
                storyComment=>{
                    this.storyCommentData = storyComment;
                    this.getCommentsByStory(storyId);
                    this.storyComment = null;
                },
                error=> this.errorMessage = error
            )
    }

    private deleteCommentStatus: boolean;
    deleteComment(comment_id, storyId) {
     this.storyService.deleteCommentById(comment_id)
     .subscribe(
         deleteComment => {
             this.deleteCommentStatus = deleteComment.status;
             this.getCommentsByStory(storyId);
         }
     )
    }

    getCommentsByStory(storyId) {
        this.storyService.fetchStoryCommentsById(storyId)
            .subscribe(
                commentList=> {
                    this.commentsList = commentList.commentsList;
                },
                error=> this.errorMessage =error
            )
    }

    getFormattedDate(date) {
        return new Date(date).toDateString();
    }

    addLabel(label, storyId) {
        var data = {
            story_label: label,
            story_id: storyId
        };
        this.storyService.addStoryLabel(JSON.stringify(data))
            .subscribe(
                storyLabel=> {
                    this.storyLabelData = storyLabel;
                    this.getLabelByStory(storyId);
                    this.getURLParam();
                    this.getMemberList();
                    this.getAllStories();
                    this.clearLabelText = '';
                },
                error=> this.errorMessage = error
            )
    }

    private labelDeleteStatus: boolean;
    removeLabel(labelId, storyId) {
        this.storyService.deleteLabelById(labelId).
        subscribe(
            deleteLabel => {
                this.labelDeleteStatus = deleteLabel.status;
                this.getLabelByStory(storyId);
                this.getURLParam();
                    this.getMemberList();
                    this.getAllStories();
            }
        )
    }

    getLabelByStory(storyId) {
        this.storyService.fetchStoryByLabel(storyId)
            .subscribe(
                storyLabelList=> {
                    this.storyLabelList = storyLabelList.labelList;
                },
                error=> this.errorMessage =error
            )
    }

    exportStoryDetails() {
      var storyData = {
          story_id: this.storyID
      };
      this.storyService.exportStoryDetails(JSON.stringify(storyData))
      .subscribe(
          exportData =>{
           //this.exportStoryData = exportData;
           this.fileExport.exportFile(exportData._body, 'story-info.csv')
          },
          error=> this.errorMessage =error
      )
    }

    deleteStory() {
    this.storyService.deleteStoryById(this.storyID)
    .subscribe(
        deleteData => {
         this.deleteMessage = deleteData.message
         this.deleteStatus = true;
         this.alertMessageClass = this.deleteStatus ? 'alert-success': '';
         this.getURLParam();
         this.getMemberList();
         this.getAllStories();
        },
        error => this.errorMessage = error
    )
    }
}
