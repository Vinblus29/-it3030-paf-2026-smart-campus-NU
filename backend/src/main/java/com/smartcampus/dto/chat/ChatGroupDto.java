package com.smartcampus.dto.chat;

import java.util.List;

public class ChatGroupDto {
    private Long id;
    private String name;
    private String description;
    private boolean broadcastOnly;
    private List<Long> memberIds;
    private boolean includeAllUsers;

    public ChatGroupDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isBroadcastOnly() { return broadcastOnly; }
    public void setBroadcastOnly(boolean broadcastOnly) { this.broadcastOnly = broadcastOnly; }
    public List<Long> getMemberIds() { return memberIds; }
    public void setMemberIds(List<Long> memberIds) { this.memberIds = memberIds; }
    public boolean isIncludeAllUsers() { return includeAllUsers; }
    public void setIncludeAllUsers(boolean includeAllUsers) { this.includeAllUsers = includeAllUsers; }
}
