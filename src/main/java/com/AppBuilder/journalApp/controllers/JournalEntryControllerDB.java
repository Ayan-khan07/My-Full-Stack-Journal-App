package com.AppBuilder.journalApp.controllers;

import com.AppBuilder.journalApp.entity.JournalEntry;
import com.AppBuilder.journalApp.entity.User;
import com.AppBuilder.journalApp.services.JournalEntryService;
import com.AppBuilder.journalApp.services.UserService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/journal")
public class JournalEntryControllerDB {

    @Autowired
    private JournalEntryService service;

    @Autowired
    private UserService userService;

    @PostMapping("/{username}")
    public ResponseEntity<?> createEntry(@RequestBody JournalEntry myEntry, @PathVariable String username){
        try{
            service.saveEntry(myEntry, username);
            return  new ResponseEntity<>(myEntry, HttpStatus.CREATED);
        }
        catch (Exception e){
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{username}")
    public ResponseEntity<?> getAlljournalEntriesByUser(@PathVariable String username){
        User user =  userService.findByUserName(username);
        if (user == null) {
            return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
        }
        List<JournalEntry> all = user.getJournalEntries();
        if(all != null && !all.isEmpty()) return new ResponseEntity<>(all, HttpStatus.OK);
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/id/{myId}")
    public ResponseEntity<JournalEntry> getById(@PathVariable ObjectId myId){
        Optional<JournalEntry> byId = service.findById(myId);
        if(byId.isPresent()){
            return new ResponseEntity<>(byId.get(), HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{username}/{myId}")
    public ResponseEntity<?> deleteById(@PathVariable ObjectId myId ,@PathVariable String username){
        try {
            service.deleteById(myId, username);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>("Error deleting entry", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{username}/{id}")
    public ResponseEntity<?> updateJournalById(
            @PathVariable String username,
            @RequestBody JournalEntry newEntry,
            @PathVariable ObjectId id
    ){
        JournalEntry old = service.findById(id).orElse(null);
        if(old != null){

            // Safer update logic (checks for null and empty)
            if (newEntry.getTitle() != null && !newEntry.getTitle().isEmpty()) {
                old.setTitle(newEntry.getTitle());
            }
            if (newEntry.getContent() != null && !newEntry.getContent().isEmpty()) {
                old.setContent(newEntry.getContent());
            }

            service.saveEntry(old); // Uses the simple save, not the one that links to user
            return new ResponseEntity<>(old, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}