package com.quelorax.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginStatsResponse {
    private long totalUsers;
    private long usersLoggedInCount;
    private long onlineNowCount;
    private long totalLogins;
}
