package com.AppBuilder.journalApp.controllers;

import com.AppBuilder.journalApp.entity.User;
import com.AppBuilder.journalApp.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUser(){
        return userService.getAll();
    }

    // Changed to saveEntry (which hashes password)
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user){
        try {
            userService.saveEntry(user);
            return new ResponseEntity<>(user, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Error creating user: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // Fixed logic: Use @PathVariable, check for user, and don't re-hash password if not changed
    @PutMapping("/{username}")
    public ResponseEntity<?> updatUser(@PathVariable String username, @RequestBody User updatedUser){
        User userInDb  = userService.findByUserName(username);
        if(userInDb != null){
            userInDb.setUserName(updatedUser.getUserName());
            if (!updatedUser.getPassword().isEmpty()) {
                userInDb.setPassword(updatedUser.getPassword());
                userService.saveEntry(userInDb); // Use saveEntry to re-hash
            } else {
                userService.saveUpdatedUser(userInDb); // Use new method to avoid re-hashing
            }

            return new ResponseEntity<>(userInDb, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}